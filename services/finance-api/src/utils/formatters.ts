import { Decimal } from '@/utils/prisma';

export const formatCurrency = (amount: Decimal | number): string => {
    const value = Number(amount);
    // Use custom formatting to ensure proper Naira symbol display
    return `₦${new Intl.NumberFormat('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)}`;
};