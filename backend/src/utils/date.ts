export const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

export const isBefore = (date: Date, compareWith: Date): boolean =>
  date.getTime() < compareWith.getTime();
