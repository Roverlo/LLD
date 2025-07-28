/**
 * Excel服务测试
 */

const { generateIpStatusDescription } = require('./excel-service');

describe('Excel Service', () => {
    describe('generateIpStatusDescription', () => {
        test('should return "待提供" when no IP pool provided', () => {
            const result = generateIpStatusDescription(10, null);
            expect(result).toBe('待提供，共需10个');
        });

        test('should return "待提供" when IP pool is empty', () => {
            const usage = { total: 0, used: 0, remaining: 0 };
            const result = generateIpStatusDescription(5, usage);
            expect(result).toBe('待提供，共需5个');
        });

        test('should return "IP充足" when provided IPs are sufficient', () => {
            const usage = { total: 20, used: 8, remaining: 12 };
            const result = generateIpStatusDescription(10, usage);
            expect(result).toBe('共需10个IP，已提供20个IP，IP充足');
        });

        test('should return "IP充足" when provided IPs exactly match requirement', () => {
            const usage = { total: 15, used: 10, remaining: 5 };
            const result = generateIpStatusDescription(15, usage);
            expect(result).toBe('共需15个IP，已提供15个IP，IP充足');
        });

        test('should return shortage info when provided IPs are insufficient', () => {
            const usage = { total: 8, used: 5, remaining: 3 };
            const result = generateIpStatusDescription(12, usage);
            expect(result).toBe('共需12个IP，已提供8个IP，待提供4个IP');
        });

        test('should handle zero requirement', () => {
            const usage = { total: 10, used: 0, remaining: 10 };
            const result = generateIpStatusDescription(0, usage);
            expect(result).toBe('共需0个IP，已提供10个IP，IP充足');
        });

        test('should handle edge case with large numbers', () => {
            const usage = { total: 100, used: 50, remaining: 50 };
            const result = generateIpStatusDescription(150, usage);
            expect(result).toBe('共需150个IP，已提供100个IP，待提供50个IP');
        });
    });
});
