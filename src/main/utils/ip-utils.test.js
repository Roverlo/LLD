/**
 * IP工具函数测试
 */

const {
    ipToInt,
    intToIp,
    pad,
    expandRange,
    parseCidr,
    parseIpSegment,
    parseIpList,
    validateIpList,
    checkDuplicateIps,
    isValidIp,
    isIpInRange,
} = require('./ip-utils');

describe('IP Utils', () => {
    describe('ipToInt', () => {
        test('should convert IP to integer correctly', () => {
            // JavaScript bitwise operations work with 32-bit signed integers
            // So we need to use unsigned right shift to get correct values
            expect(ipToInt('192.168.1.1') >>> 0).toBe(3232235777);
            expect(ipToInt('0.0.0.0')).toBe(0);
            expect(ipToInt('255.255.255.255') >>> 0).toBe(4294967295);
            expect(ipToInt('10.0.0.1')).toBe(167772161);
        });
    });

    describe('intToIp', () => {
        test('should convert integer to IP correctly', () => {
            expect(intToIp(3232235777)).toBe('192.168.1.1');
            expect(intToIp(0)).toBe('0.0.0.0');
            expect(intToIp(4294967295)).toBe('255.255.255.255');
            expect(intToIp(167772161)).toBe('10.0.0.1');
        });
    });

    describe('pad', () => {
        test('should pad single digits with zero', () => {
            expect(pad(1)).toBe('01');
            expect(pad(9)).toBe('09');
            expect(pad(10)).toBe('10');
            expect(pad(99)).toBe('99');
        });
    });

    describe('expandRange', () => {
        test('should expand IP range correctly', () => {
            const result = expandRange('192.168.1.1', '192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should handle single IP range', () => {
            const result = expandRange('192.168.1.1', '192.168.1.1');
            expect(result).toEqual(['192.168.1.1']);
        });

        test('should handle invalid range gracefully', () => {
            const result = expandRange('invalid', 'invalid');
            expect(result).toEqual([]);
        });
    });

    describe('parseCidr', () => {
        test('should parse CIDR notation correctly', () => {
            const result = parseCidr('192.168.1.0/30');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
        });

        test('should handle /24 subnet', () => {
            const result = parseCidr('10.0.0.0/30');
            expect(result).toEqual(['10.0.0.1', '10.0.0.2']);
        });

        test('should handle invalid CIDR gracefully', () => {
            expect(parseCidr('invalid/cidr')).toEqual([]);
            expect(parseCidr('192.168.1.0/33')).toEqual([]);
            expect(parseCidr('192.168.1.0/-1')).toEqual([]);
        });
    });

    describe('parseIpSegment', () => {
        test('should parse CIDR format', () => {
            const result = parseIpSegment('192.168.1.0/30');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
        });

        test('should parse range format', () => {
            const result = parseIpSegment('192.168.1.1-192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse short range format', () => {
            const result = parseIpSegment('192.168.1.1-3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse single IP', () => {
            const result = parseIpSegment('192.168.1.1');
            expect(result).toEqual(['192.168.1.1']);
        });

        test('should handle invalid formats', () => {
            expect(parseIpSegment('invalid')).toEqual([]);
            expect(parseIpSegment('192.168.1.1-')).toEqual([]);
            expect(parseIpSegment('192.168.1.1-2-3')).toEqual([]);
        });
    });

    describe('parseIpList', () => {
        test('should parse semicolon separated list', () => {
            const result = parseIpList('192.168.1.1;192.168.1.2;192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse comma separated list', () => {
            const result = parseIpList('192.168.1.1,192.168.1.2,192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse mixed formats', () => {
            const result = parseIpList('192.168.1.1-3;10.0.0.0/30');
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('192.168.1.1');
            expect(result).toContain('10.0.0.1');
        });

        test('should handle empty string', () => {
            expect(parseIpList('')).toEqual([]);
            expect(parseIpList(null)).toEqual([]);
            expect(parseIpList(undefined)).toEqual([]);
        });

        test('should handle whitespace', () => {
            const result = parseIpList(' 192.168.1.1 ; 192.168.1.2 ');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
        });

        test('should parse Chinese semicolon separated list', () => {
            const result = parseIpList('192.168.1.1；192.168.1.2；192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse Chinese comma separated list', () => {
            const result = parseIpList('192.168.1.1，192.168.1.2，192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse space separated list', () => {
            const result = parseIpList('192.168.1.1 192.168.1.2 192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse newline separated list', () => {
            const result = parseIpList('192.168.1.1\n192.168.1.2\r\n192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse tab separated list', () => {
            const result = parseIpList('192.168.1.1\t192.168.1.2\t192.168.1.3');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should parse mixed separators', () => {
            const result = parseIpList('192.168.1.1；192.168.1.2，192.168.1.3 192.168.1.4\n192.168.1.5\t192.168.1.6');
            expect(result).toEqual([
                '192.168.1.1',
                '192.168.1.2',
                '192.168.1.3',
                '192.168.1.4',
                '192.168.1.5',
                '192.168.1.6',
            ]);
        });

        test('should handle multiple consecutive separators', () => {
            const result = parseIpList('192.168.1.1;;;   ，，，\n\n\t\t192.168.1.2');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
        });

        test('should handle leading and trailing separators', () => {
            const result = parseIpList('；，  \n\t192.168.1.1；192.168.1.2，  \n\t');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
        });
    });

    describe('isValidIp', () => {
        test('should validate correct IP addresses', () => {
            expect(isValidIp('192.168.1.1')).toBe(true);
            expect(isValidIp('0.0.0.0')).toBe(true);
            expect(isValidIp('255.255.255.255')).toBe(true);
            expect(isValidIp('10.0.0.1')).toBe(true);
        });

        test('should reject invalid IP addresses', () => {
            expect(isValidIp('256.1.1.1')).toBe(false);
            expect(isValidIp('192.168.1')).toBe(false);
            expect(isValidIp('192.168.1.1.1')).toBe(false);
            expect(isValidIp('invalid')).toBe(false);
            expect(isValidIp('192.168.01.1')).toBe(false); // Leading zeros
        });
    });

    describe('isIpInRange', () => {
        test('should check if IP is in range', () => {
            expect(isIpInRange('192.168.1.5', '192.168.1.1', '192.168.1.10')).toBe(true);
            expect(isIpInRange('192.168.1.1', '192.168.1.1', '192.168.1.10')).toBe(true);
            expect(isIpInRange('192.168.1.10', '192.168.1.1', '192.168.1.10')).toBe(true);
        });

        test('should return false for IP outside range', () => {
            expect(isIpInRange('192.168.1.11', '192.168.1.1', '192.168.1.10')).toBe(false);
            expect(isIpInRange('192.168.0.255', '192.168.1.1', '192.168.1.10')).toBe(false);
        });
    });

    describe('Error handling tests', () => {
        test('should handle reverse IP ranges correctly', () => {
            // 测试反向范围：起始IP大于结束IP
            const result = expandRange('192.168.1.10', '192.168.1.5');
            expect(result).toEqual([]);
        });

        test('should detect reverse range errors in parseIpSegment', () => {
            const result = parseIpSegment('192.168.1.10-192.168.1.5');
            expect(result).toEqual([]);
        });

        test('should provide detailed error information with validateIpList', () => {
            const { ips, errors } = validateIpList('192.168.1.10-192.168.1.5;192.168.1.1-3');

            expect(ips).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('起始IP 192.168.1.10 大于结束IP 192.168.1.5');
        });

        test('should handle invalid IP formats', () => {
            const { ips, errors } = validateIpList('192.168.1.300;invalid-ip;192.168.1.1');

            expect(ips).toEqual(['192.168.1.1']);
            expect(errors.length).toBeGreaterThan(0);
        });

        test('should handle mixed valid and invalid inputs', () => {
            const { ips, errors } = validateIpList('192.168.1.1-3;192.168.1.10-5;192.168.2.1');

            expect(ips).toContain('192.168.1.1');
            expect(ips).toContain('192.168.1.2');
            expect(ips).toContain('192.168.1.3');
            expect(ips).toContain('192.168.2.1');
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('起始IP 192.168.1.10 大于结束IP 192.168.1.5');
        });

        test('should detect duplicate IPs in different ranges', () => {
            const { ips, errors } = validateIpList('192.168.1.10-192.168.1.13;192.168.1.10-192.168.1.12');

            // 应该包含所有有效IP
            expect(ips).toContain('192.168.1.10');
            expect(ips).toContain('192.168.1.11');
            expect(ips).toContain('192.168.1.12');
            expect(ips).toContain('192.168.1.13');

            // 应该检测到重复IP
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((error) => error.includes('192.168.1.10') && error.includes('重复'))).toBe(true);
            expect(errors.some((error) => error.includes('192.168.1.11') && error.includes('重复'))).toBe(true);
            expect(errors.some((error) => error.includes('192.168.1.12') && error.includes('重复'))).toBe(true);
        });

        test('should detect multiple duplicate IPs', () => {
            const { ips, errors } = validateIpList('192.168.1.1;192.168.1.2;192.168.1.1;192.168.1.3;192.168.1.2');

            expect(ips).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.1', '192.168.1.3', '192.168.1.2']);
            expect(errors).toHaveLength(2); // 两个重复IP
            expect(errors.some((error) => error.includes('192.168.1.1') && error.includes('2 次'))).toBe(true);
            expect(errors.some((error) => error.includes('192.168.1.2') && error.includes('2 次'))).toBe(true);
        });
    });

    describe('checkDuplicateIps function', () => {
        test('should return empty array for unique IPs', () => {
            const errors = checkDuplicateIps(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            expect(errors).toEqual([]);
        });

        test('should detect single duplicate IP', () => {
            const errors = checkDuplicateIps(['192.168.1.1', '192.168.1.2', '192.168.1.1']);
            expect(errors).toHaveLength(1);
            expect(errors[0]).toContain('192.168.1.1');
            expect(errors[0]).toContain('2 次');
        });

        test('should detect multiple duplicate IPs', () => {
            const errors = checkDuplicateIps([
                '192.168.1.1',
                '192.168.1.2',
                '192.168.1.1',
                '192.168.1.2',
                '192.168.1.3',
            ]);
            expect(errors).toHaveLength(2);
            expect(errors.some((error) => error.includes('192.168.1.1') && error.includes('2 次'))).toBe(true);
            expect(errors.some((error) => error.includes('192.168.1.2') && error.includes('2 次'))).toBe(true);
        });
    });

    describe('Integration tests', () => {
        test('should handle complex IP parsing scenarios', () => {
            const complexList = '192.168.1.1-5;10.0.0.0/30,172.16.0.1';
            const result = parseIpList(complexList);

            expect(result.length).toBeGreaterThan(5);
            expect(result).toContain('192.168.1.1');
            expect(result).toContain('192.168.1.5');
            expect(result).toContain('10.0.0.1');
            expect(result).toContain('172.16.0.1');
        });

        test('should maintain IP order in ranges', () => {
            const result = expandRange('192.168.1.1', '192.168.1.5');
            expect(result[0]).toBe('192.168.1.1');
            expect(result[4]).toBe('192.168.1.5');
            expect(result).toHaveLength(5);
        });

        test('should maintain backward compatibility', () => {
            // 测试不使用returnErrors参数时的向后兼容性
            const result = parseIpList('192.168.1.1-3');
            expect(Array.isArray(result)).toBe(true);
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });
    });
});
