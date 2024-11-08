const crypto = require('crypto');

export class CFCGenerator {
    private FIXED_KEY: string = '521325fb2dd486bf4831b47644317fca'
    private COMFORT_CLOUD: string =  'Comfort Cloud'


    toUTF8String(str: string) {
        return Buffer.from(str, 'utf8');
    }

    processTimestamp(dateString: string) {
        const date = new Date(dateString.replace(' ', 'T') + 'Z');
        return date.getTime();
    }

    constructBuffer(timestamp: string, token: string | null = null) {
        const timeDiff = this.processTimestamp(timestamp);

        const components = [
            this.toUTF8String(this.COMFORT_CLOUD),
            this.toUTF8String(this.FIXED_KEY),
            this.toUTF8String(timeDiff.toString()),
            this.toUTF8String('Bearer ')
        ];

        if (token) {
            components.push(this.toUTF8String(token));
        }

        const totalSize = components.reduce((acc, buf) => acc + buf.length, 0);
        const result = Buffer.alloc(totalSize);
        
        let offset = 0;
        components.forEach((buf) => {
            buf.copy(result, offset);
            offset += buf.length;
        });

        return result;
    }

    insertCfc(hash: string) {
        const insertPos = 9;
        return hash.slice(0, insertPos) + 'cfc' + hash.slice(insertPos);
    }
    
    generateKey(timestamp: string | null = null, token: string | null = null) {
        try {
            const now = new Date();
            const effectiveTimestamp = timestamp || now.toLocaleString('sv').replace(',', '');
            const input = this.constructBuffer(effectiveTimestamp, token);
            const hash = crypto.createHash('sha256')
                .update(input)
                .digest('hex');

            const result = this.insertCfc(hash);
            return result;
        } catch (error) {
            console.error('Error:', error);
            return '1';
        }
    }
}