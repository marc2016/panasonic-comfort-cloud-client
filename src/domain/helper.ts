export function padTo2Digits(num: number): string {
  return num.toString().padStart(2, '0');
}

export function getDateForHistoryData(date: Date): string {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join(''))
}

export function getTimezoneForHistoryData(date: Date) {
  var tzo = -date.getTimezoneOffset()
  var dif = tzo >= 0 ? '+' : '-'
  const pad = function(num: number) {
    return (num < 10 ? '0' : '') + num;
  }
  return dif + pad(Math.floor(Math.abs(tzo) / 60))
}