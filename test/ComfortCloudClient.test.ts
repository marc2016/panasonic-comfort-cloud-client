
import { ComfortCloudClient } from '../src/ComfortCloudClient.js'
import { Group } from '../src/model/Group.js'
import { Device } from '../src/model/Device.js'
import { OAuthClient } from '../src/OAuthClient.js'
import { AppType, Power, OperationMode, EcoMode, AirSwingUD, AirSwingLR, FanAutoMode, FanSpeed } from '../src/domain/enums.js'
import axios, { AxiosError } from 'axios'
import { AppVersionRejectedError } from '../src/model/AppVersionRejectedError.js'
import { AuthenticationError } from '../src/model/AuthenticationError.js'
import { AdapterCommunicationError } from '../src/model/AdapterCommunicationError.js'
import { TokenExpiredError } from '../src/model/TokenExpiredError.js'
import { ServiceError } from '../src/model/ServiceError.js'
import { mockGroupResponse, mockDeviceResponse } from './fixtures.js'

// Mock axios for ComfortCloudClient calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock OAuthClient class
jest.mock('../src/OAuthClient.js');
const MockedOAuthClient = OAuthClient as jest.MockedClass<typeof OAuthClient>;

describe('ComfortCloudClient Tests', () => {
  let client: ComfortCloudClient;
  const dummyToken = 'dummy-token';
  const dummyRefreshToken = 'dummy-refresh-token';
  const dummyClientId = 'dummy-client-id';

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup MockedOAuthClient implementation
    MockedOAuthClient.mockImplementation(() => {
      return {
        oAuthProcess: jest.fn().mockResolvedValue(dummyToken),
        refreshToken: jest.fn().mockResolvedValue(dummyToken),
        token: dummyToken,
        tokenRefresh: dummyRefreshToken,
        stopAutoRefresh: jest.fn()
      } as unknown as OAuthClient;
    });

    // Mock axios.create to return the mocked instance
    // Note: ComfortCloudClient uses this instance
    mockedAxios.create = jest.fn(() => mockedAxios);

    client = new ComfortCloudClient();
  });

  test('login', async () => {
    const username = 'testuser';
    const password = 'testpassword';

    // Mock getClientId call
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { clientId: dummyClientId }
    });

    await client.login(username, password);

    // Verify OAuth process was called
    expect(client.oauthClient.oAuthProcess).toHaveBeenCalledWith(username, password);

    // Verify clientId was fetched
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/auth/v2/login',
      expect.anything(),
      expect.anything()
    );
  });

  test('refreshToken', async () => {
    const username = 'testuser';
    const password = 'testpassword';

    // Setup initial client
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { clientId: dummyClientId } });
    await client.login(username, password);

    // Setup clean mocks for refresh test
    jest.clearAllMocks();

    const clientRefreshToken = new ComfortCloudClient();

    // Mock refresh token flow
    // 1. refreshToken called on OAuthClient
    // 2. getClientId called via axios
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { clientId: dummyClientId } });

    await clientRefreshToken.login('', '', dummyRefreshToken);

    expect(clientRefreshToken.oauthClient.refreshToken).toHaveBeenCalledWith(dummyRefreshToken);
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/v2/login', expect.anything(), expect.anything());
  });

  test('getGroups', async () => {
    // Setup logged in state
    client.oauthClient.token = dummyToken;

    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: mockGroupResponse
    });

    const groups = await client.getGroups();

    expect(groups.length).toBe(1);
    expect(groups[0] instanceof Group).toBeTruthy();
    expect(groups[0].name).toBe('Home');
    expect(groups[0].devices.length).toBe(5);

    // Check first device (Kitchen)
    expect(groups[0].devices[0]).toBeDefined();
    expect(groups[0].devices[0].guid).toBe('dev1-kitchen');
    expect(groups[0].devices[0].name).toBe('Kitchen');
    expect(groups[0].devices[0].temperatureSet).toBe(24);

    // Check last device (Kids Room)
    expect(groups[0].devices[4].guid).toBe('dev5-kids');
    expect(groups[0].devices[4].name).toBe('Kids Room');
    expect(groups[0].devices[4].operate).toBe(0); // Off
  });

  test('getDevice', async () => {
    const deviceGuid = 'device1';

    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: mockDeviceResponse
    });

    const device = await client.getDevice(deviceGuid);

    expect(device).not.toBeNull();
    expect(device?.guid).toBe(deviceGuid);
    expect(device?.temperatureSet).toBe(22);
  });

  test('setDevice', async () => {
    // Mock getDevice first to have a device object
    const deviceGuid = 'device1';
    // We don't actually need to call getDevice to create a device object
    const device = new Device(deviceGuid, 'Test Device');
    device.temperatureSet = 22;
    device.operate = Power.On;

    // Mock setDevice call
    mockedAxios.post.mockResolvedValue({
      data: { success: true }
    });

    await client.setDevice(device);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    const [url, body] = mockedAxios.post.mock.calls[0];
    expect(url).toBe('/deviceStatus/control');
    expect((body as any).deviceGuid).toBe(deviceGuid);
    expect((body as any).parameters.temperatureSet).toBe(22);
  });

  test('appVersion and appType default to library default and Android', () => {
    expect(client.appVersion).toBe(client.defaultAppVersion);
    expect(client.appType).toBe(AppType.ANDROID);
  });

  test('login and getGroups send X-APP-TYPE 0 for iOS', async () => {
    const iosClient = new ComfortCloudClient('5.1.1', AppType.IOS);
    expect(iosClient.appVersion).toBe('5.1.1');
    expect(iosClient.appType).toBe(AppType.IOS);

    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { clientId: dummyClientId } });
    await iosClient.login('testuser', 'testpassword');
    const loginHeaders = (mockedAxios.post.mock.calls[0][2] as any).headers;
    expect(loginHeaders['X-APP-TYPE']).toBe('0');
    expect(loginHeaders['X-APP-VERSION']).toBe('5.1.1');

    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockGroupResponse });
    await iosClient.getGroups();
    const groupHeaders = (mockedAxios.get.mock.calls[0][1] as any).headers;
    expect(groupHeaders['X-APP-TYPE']).toBe('0');
  });

  test('login sends X-APP-TYPE 1 when only a version is passed', async () => {
    const versionOnlyClient = new ComfortCloudClient('5.1.0');
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { clientId: dummyClientId } });
    await versionOnlyClient.login('testuser', 'testpassword');
    const headers = (mockedAxios.post.mock.calls[0][2] as any).headers;
    expect(headers['X-APP-TYPE']).toBe('1');
    expect(headers['X-APP-VERSION']).toBe('5.1.0');
  });

  function apiError(code: number, message: string): AxiosError {
    const error = new AxiosError();
    return Object.assign(error, {
      message: 'Request failed with status code 401',
      status: 401,
      response: { status: 401, data: { code, message } },
    });
  }

  test('login rejected with 4106 throws AppVersionRejectedError', async () => {
    const iosClient = new ComfortCloudClient('5.1.0', AppType.IOS);
    mockedAxios.post.mockRejectedValueOnce(apiError(4106, 'New version app has been published'));

    const error = await iosClient.login('testuser', 'testpassword').catch(e => e);

    expect(error).toBeInstanceOf(AppVersionRejectedError);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe(4106);
    expect(error.appVersion).toBe('5.1.0');
    expect(error.appType).toBe(AppType.IOS);
    expect(error.message).toContain('5.1.0 (iOS');
  });

  test('login rejected with 4100 still throws TokenExpiredError', async () => {
    mockedAxios.post.mockRejectedValueOnce(apiError(4100, 'Token expires'));

    const error = await client.login('testuser', 'testpassword').catch(e => e);

    expect(error).toBeInstanceOf(TokenExpiredError);
    expect(error).not.toBeInstanceOf(AppVersionRejectedError);
  });

  test('onTokenChange option is passed to the OAuthClient', () => {
    const onTokenChange = jest.fn();
    new ComfortCloudClient('5.1.1', AppType.IOS, { onTokenChange });
    expect(MockedOAuthClient).toHaveBeenLastCalledWith('5.1.1', true, onTokenChange, undefined);
  });

  test('onRefreshError option is passed to the OAuthClient', () => {
    const onRefreshError = jest.fn();
    new ComfortCloudClient('5.1.0', AppType.ANDROID, { onRefreshError });
    expect(MockedOAuthClient).toHaveBeenLastCalledWith('5.1.0', true, undefined, onRefreshError);
  });

  test('dispose stops the automatic refresh', () => {
    client.dispose();
    expect(client.oauthClient.stopAutoRefresh).toHaveBeenCalledTimes(1);
  });

  function httpError(status: number, data: any, config: any = { baseURL: 'https://accsmart.panasonic.com' }): AxiosError {
    const error = new AxiosError();
    return Object.assign(error, {
      message: `Request failed with status code ${status}`,
      status,
      config,
      response: { status, statusText: 'Error', data },
    });
  }

  function oauthClientRejecting(error: AxiosError) {
    (client.oauthClient.oAuthProcess as jest.Mock).mockRejectedValueOnce(error);
  }

  test('wrong password from the OAuth host throws AuthenticationError', async () => {
    oauthClientRejecting(httpError(401,
      { name: 'ValidationError', code: 'invalid_user_password', description: 'Wrong email or password.' },
      { baseURL: 'https://authglb.digital.panasonic.com', url: '/usernamepassword/login' }));

    const error = await client.login('testuser', 'wrong').catch(e => e);

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.httpCode).toBe(401);
    expect(error.message).toBe('HTTP 401: Wrong email or password.');
  });

  test('invalid refresh token from the OAuth host throws AuthenticationError', async () => {
    (client.oauthClient.refreshToken as jest.Mock).mockRejectedValueOnce(httpError(403,
      { error: 'invalid_grant', error_description: 'Unknown or invalid refresh token.' },
      { baseURL: 'https://authglb.digital.panasonic.com', url: '/oauth/token' }));

    const error = await client.login('', '', 'old-refresh').catch(e => e);

    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.message).toBe('HTTP 403: Unknown or invalid refresh token.');
  });

  test('Comfort Cloud error without body yields a clean ServiceError', async () => {
    mockedAxios.get.mockRejectedValueOnce(httpError(500, ''));

    const error = await client.getGroups().catch(e => e);

    expect(error).toBeInstanceOf(ServiceError);
    expect(error).not.toBeInstanceOf(AuthenticationError);
    expect(error.code).toBe(-1);
    expect(error.httpCode).toBe(500);
    expect(error.message).toContain('500');
    expect(error.message).not.toContain('undefined');
  });

  test('known Comfort Cloud codes keep their error types', async () => {
    mockedAxios.get.mockRejectedValueOnce(httpError(401, { code: 4100, message: 'Token expires' }));
    expect(await client.getGroups().catch(e => e)).toBeInstanceOf(TokenExpiredError);

    mockedAxios.get.mockRejectedValueOnce(httpError(401, { code: 4106, message: 'New version app has been published' }));
    expect(await client.getGroups().catch(e => e)).toBeInstanceOf(AppVersionRejectedError);

    mockedAxios.get.mockRejectedValueOnce(httpError(500, { code: 5005, message: 'Adapter communication error' }));
    const adapterError = await client.getGroups().catch(e => e);
    expect(adapterError).toBeInstanceOf(AdapterCommunicationError);
    expect(adapterError.message).not.toContain('undefined');
  });

});
