/**
 * Excel服务测试
 */

const { generateIpStatusDescription, formatIpRangeDisplay } = require('./excel-service');

describe('Excel Service', () => {
    describe('generateIpStatusDescription', () => {
        test('should return unified format when no IP pool provided', () => {
            const result = generateIpStatusDescription(10, null);
            expect(result).toBe('共需10个IP，已提供0个IP，待提供10个IP');
        });

        test('should return unified format when IP pool is empty', () => {
            const usage = { total: 0, used: 0, remaining: 0 };
            const result = generateIpStatusDescription(5, usage);
            expect(result).toBe('共需5个IP，已提供0个IP，待提供5个IP');
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

    describe('formatIpRangeDisplay', () => {
        test('should return "待提供" for empty or null input', () => {
            expect(formatIpRangeDisplay('')).toBe('待提供');
            expect(formatIpRangeDisplay(null)).toBe('待提供');
            expect(formatIpRangeDisplay(undefined)).toBe('待提供');
            expect(formatIpRangeDisplay('   ')).toBe('待提供');
        });

        test('should normalize spaces', () => {
            const result = formatIpRangeDisplay('192.168.1.1-192.168.1.10   192.168.2.1-192.168.2.5');
            expect(result).toBe('192.168.1.1-192.168.1.10 192.168.2.1-192.168.2.5');
        });

        test('should convert Chinese punctuation to English', () => {
            const result = formatIpRangeDisplay('192.168.1.1-10，192.168.2.1-5；192.168.3.1/24');
            expect(result).toBe('192.168.1.1-10, 192.168.2.1-5; 192.168.3.1/24');
        });

        test('should standardize comma and semicolon spacing', () => {
            const result = formatIpRangeDisplay('192.168.1.1-10,192.168.2.1-5;192.168.3.1/24');
            expect(result).toBe('192.168.1.1-10, 192.168.2.1-5; 192.168.3.1/24');
        });

        test('should handle complex mixed format', () => {
            const input = '192.168.1.1-10，  192.168.2.1-5 ；192.168.3.1/24    192.168.4.1-192.168.4.20';
            const expected = '192.168.1.1-10, 192.168.2.1-5; 192.168.3.1/24 192.168.4.1-192.168.4.20';
            expect(formatIpRangeDisplay(input)).toBe(expected);
        });

        test('should preserve valid format', () => {
            const input = '192.168.1.1-192.168.1.10, 192.168.2.1/24; 10.0.0.1-10.0.0.50';
            expect(formatIpRangeDisplay(input)).toBe(input);
        });
    });
});
