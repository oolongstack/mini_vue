const queue = [];
let isFlushing = false;
const resolvePromise = Promise.resolve();
// 组件的异步更新
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      const copy = queue.slice();
      for (let i = 0; i < copy.length; i++) {
        const job = copy[i];
        job();
      }
      queue.length = 0;
      copy.length = 0;
      isFlushing = false;
    });
  }
}
