export const runConcurrentRequests = async <T>(
  tasks: Array<() => Promise<T>>,
): Promise<PromiseSettledResult<T>[]> => {
  return Promise.allSettled(tasks.map((task) => task()));
};

export const runWithBarrier = async <T>(
  actions: Array<() => Promise<T>>,
): Promise<T[]> => {
  const results = await Promise.all(actions.map((action) => action()));
  return results;
};
