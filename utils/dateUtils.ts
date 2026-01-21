export function getAppStartDate(
  transactions: Array<{ date: Date }> = [],
  bills: Array<{ createdAt: Date }> = [],
  accounts: Array<{ createdAt: Date }> = []
): Date {
  const dates: Date[] = [];

  // Collect all dates
  transactions.forEach(t => {
    if (t.date) dates.push(new Date(t.date));
  });
  
  bills.forEach(b => {
    if (b.createdAt) dates.push(new Date(b.createdAt));
  });
  
  accounts.forEach(a => {
    if (a.createdAt) dates.push(new Date(a.createdAt));
  });

  // If no data exists, return today
  if (dates.length === 0) {
    return new Date();
  }

  // Return the earliest date
  return new Date(Math.min(...dates.map(d => d.getTime())));
}

/** Get all months with data (month-year combinations) */
export function getMonthsWithData(
  transactions: Array<{ date: Date }> = [],
  bills: Array<{ createdAt: Date }> = []
): Set<string> {
  const monthsSet = new Set<string>();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Add all transaction months
  transactions.forEach(t => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthsSet.add(key);
  });

  // Add all bill created months
  bills.forEach(b => {
    const date = new Date(b.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthsSet.add(key);
  });

  // Always include current month
  monthsSet.add(`${currentYear}-${currentMonth}`);

  return monthsSet;
}

/** Get all years with data */
export function getYearsWithData(
  transactions: Array<{ date: Date }> = [],
  bills: Array<{ createdAt: Date }> = []
): Set<number> {
  const yearsSet = new Set<number>();
  const today = new Date();

  // Add all transaction years
  transactions.forEach(t => {
    const date = new Date(t.date);
    yearsSet.add(date.getFullYear());
  });

  // Add all bill created years
  bills.forEach(b => {
    const date = new Date(b.createdAt);
    yearsSet.add(date.getFullYear());
  });

  // Always include current year
  yearsSet.add(today.getFullYear());

  return yearsSet;
}

/** Check if a specific month has data */
export function hasDataForMonth(
  year: number,
  month: number,
  monthsWithData: Set<string>
): boolean {
  return monthsWithData.has(`${year}-${month}`);
}

/** Check if a specific year has data */
export function hasDataForYear(
  year: number,
  yearsWithData: Set<number>
): boolean {
  return yearsWithData.has(year);
}

export function canNavigateToPreviousMonth(
  currentMonth: number,
  currentYear: number,
  appStartDate: Date
): boolean {
  const appStartMonth = appStartDate.getMonth();
  const appStartYear = appStartDate.getFullYear();

  // Can't go before app start month/year
  if (currentYear < appStartYear) return false;
  if (currentYear === appStartYear && currentMonth <= appStartMonth) return false;

  return true;
}

export function canNavigateToPreviousYear(
  selectedYear: number,
  appStartDate: Date
): boolean {
  const appStartYear = appStartDate.getFullYear();
  return selectedYear > appStartYear;
}

export function getMinMonth(
  selectedYear: number,
  appStartDate: Date
): number {
  const appStartYear = appStartDate.getFullYear();
  if (selectedYear > appStartYear) return 0;
  if (selectedYear === appStartYear) return appStartDate.getMonth();
  return 0;
}
