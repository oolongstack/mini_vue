export function getSequence(arr: number[]) {
  const len = arr.length;
  const p = arr.slice();
  const result = [0];
  let resultLastIndex;
  let start;
  let end;
  let middle;
  for (let i = 0; i < len; i++) {
    let arrI = arr[i];
    // vue中 0 代表没有可用的复用节点
    if (arrI !== 0) {
      // 结果集中的最后一项
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        result.push(i);
        p[i] = resultLastIndex;
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = Math.floor((start + end) / 2);
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arr[result[end]] > arrI) {
        result[end] = i;
        p[i] = result[end - 1];
      }
    }
  }
  let i = result.length;
  let last = result[i - 1];
  while (i-- > 0) {
    result[i] = last;
    last = p[last];
  }
  return result;
}
