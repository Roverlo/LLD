/**
 * IP地址处理工具函数
 */

/**
 * 将IP地址转换为整数
 * @param {string} ip - IP地址字符串
 * @returns {number} IP地址对应的整数
 */
const ipToInt = (ip) => ip.split('.').reduce((a, b) => (a << 8) + parseInt(b, 10), 0);

/**
 * 将整数转换为IP地址
 * @param {number} n - 整数
 * @returns {string} IP地址字符串
 */
const intToIp = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

/**
 * 数字补零函数
 * @param {number} n - 数字
 * @returns {string} 补零后的字符串
 */
const pad = (n) => (n < 10 ? '0' : '') + n;

/**
 * 展开IP地址范围
 * @param {string} sip - 起始IP
 * @param {string} eip - 结束IP
 * @returns {string[]} IP地址数组
 */
const expandRange = (sip, eip) => {
    const ips = [];
    try {
        const startInt = ipToInt(sip);
        const endInt = ipToInt(eip);

        // 检查起始IP是否大于结束IP
        if (startInt > endInt) {
            // eslint-disable-next-line no-console
            console.warn(`Invalid IP range: start IP ${sip} is greater than end IP ${eip}. Range will be empty.`);
            return [];
        }

        for (let s = startInt; s <= endInt; s++) {
            ips.push(intToIp(s));
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error expanding range: ${sip}-${eip}`, e);
    }
    return ips;
};

/**
 * 解析CIDR格式的IP范围
 * @param {string} cidr - CIDR格式字符串
 * @returns {string[]} IP地址数组
 */
const parseCidr = (cidr) => {
    const ips = [];
    try {
        const [ip, lenStr] = cidr.split('/');
        const len = parseInt(lenStr, 10);
        if (isNaN(len) || len < 0 || len > 32) {
            return [];
        }
        const baseInt = ipToInt(ip);
        const mask = (~0 << (32 - len)) >>> 0;
        const first = (baseInt & mask) + 1;
        const last = (baseInt | ~mask) - 1;
        for (let i = first; i <= last; i++) {
            ips.push(intToIp(i));
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error parsing CIDR: ${cidr}`, e);
    }
    return ips;
};

/**
 * 解析IP段（支持CIDR、范围、单个IP）
 * @param {string} seg - IP段字符串
 * @returns {string[]} IP地址数组
 */
const parseIpSegment = (seg) => {
    try {
        if (seg.includes('/')) {
            return parseCidr(seg);
        }
        if (seg.includes('-')) {
            const parts = seg.split('-');
            if (parts.length !== 2) {
                // eslint-disable-next-line no-console
                console.warn(`Invalid IP range format: ${seg}. Expected format: "start-end"`);
                return [];
            }
            const [start, endPart] = parts;
            let end = endPart;

            // 处理简写格式，如 192.168.1.1-5
            if ((end.match(/\./g) || []).length < 3) {
                const startParts = start.split('.');
                if (startParts.length === 4) {
                    end = `${startParts.slice(0, 3).join('.')}.${end}`;
                } else {
                    // eslint-disable-next-line no-console
                    console.warn(`Invalid start IP format: ${start} in range ${seg}`);
                    return []; // Invalid start IP
                }
            }

            // 验证IP格式
            if (!isValidIp(start)) {
                // eslint-disable-next-line no-console
                console.warn(`Invalid start IP address: ${start} in range ${seg}`);
                return [];
            }
            if (!isValidIp(end)) {
                // eslint-disable-next-line no-console
                console.warn(`Invalid end IP address: ${end} in range ${seg}`);
                return [];
            }

            return expandRange(start, end);
        }
        // Basic validation for a single IP
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(seg)) {
            if (isValidIp(seg)) {
                return [seg];
            } else {
                // eslint-disable-next-line no-console
                console.warn(`Invalid IP address: ${seg}`);
                return [];
            }
        }

        // eslint-disable-next-line no-console
        console.warn(`Unrecognized IP format: ${seg}`);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Failed to parse IP segment: ${seg}`, e);
    }
    return [];
};

/**
 * 解析IP列表（支持中英文分号、逗号、空格、换行分隔）
 * @param {string} str - IP列表字符串
 * @param {boolean} returnErrors - 是否返回错误信息，默认false保持向后兼容
 * @returns {string[]|Object} IP地址数组或包含ips和errors的对象
 */
const parseIpList = (str, returnErrors = false) => {
    if (!str || typeof str !== 'string') {
        return returnErrors ? { ips: [], errors: [] } : [];
    }

    // 支持多种分隔符：
    // - 中文分号：；
    // - 英文分号：;
    // - 中文逗号：，
    // - 英文逗号：,
    // - 空格（单个或多个）
    // - 换行符（\n, \r\n, \r）
    // - 制表符：\t
    const normalizedStr = str
        .replace(/；/g, ';') // 中文分号转英文分号
        .replace(/，/g, ',') // 中文逗号转英文逗号
        .replace(/[,\s\r\n\t]+/g, ';') // 逗号、空格、换行、制表符都转为分号
        .replace(/;+/g, ';') // 多个连续分号合并为一个
        .replace(/^;|;$/g, ''); // 去除首尾分号

    if (!normalizedStr) {
        return returnErrors ? { ips: [], errors: [] } : [];
    }

    const segments = normalizedStr.split(';').filter((s) => s.trim());
    const allIps = [];
    const errors = [];

    for (const seg of segments) {
        const trimmedSeg = seg.trim();
        if (trimmedSeg) {
            const ips = parseIpSegment(trimmedSeg);

            if (ips.length === 0) {
                // 检查是否是反向范围错误
                if (trimmedSeg.includes('-')) {
                    const parts = trimmedSeg.split('-');
                    if (parts.length === 2) {
                        const [start, endPart] = parts;
                        let end = endPart;

                        // 处理简写格式
                        if ((end.match(/\./g) || []).length < 3) {
                            const startParts = start.split('.');
                            if (startParts.length === 4) {
                                end = `${startParts.slice(0, 3).join('.')}.${end}`;
                            }
                        }

                        if (isValidIp(start) && isValidIp(end)) {
                            const startInt = ipToInt(start);
                            const endInt = ipToInt(end);
                            if (startInt > endInt) {
                                errors.push(`IP范围错误：起始IP ${start} 大于结束IP ${end}，请检查输入格式`);
                            } else {
                                errors.push(`无效的IP格式：${trimmedSeg}`);
                            }
                        } else {
                            errors.push(`无效的IP地址：${trimmedSeg}`);
                        }
                    } else {
                        errors.push(`无效的IP范围格式：${trimmedSeg}`);
                    }
                } else {
                    errors.push(`无效的IP格式：${trimmedSeg}`);
                }
            } else {
                allIps.push(...ips);
            }
        }
    }

    return returnErrors ? { ips: allIps, errors } : allIps;
};

/**
 * 验证IP地址格式
 * @param {string} ip - IP地址
 * @returns {boolean} 是否有效
 */
const isValidIp = (ip) => {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every((part) => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255 && part === num.toString();
    });
};

/**
 * 检查IP地址是否在范围内
 * @param {string} ip - 要检查的IP
 * @param {string} startIp - 范围起始IP
 * @param {string} endIp - 范围结束IP
 * @returns {boolean} 是否在范围内
 */
const isIpInRange = (ip, startIp, endIp) => {
    const ipInt = ipToInt(ip);
    const startInt = ipToInt(startIp);
    const endInt = ipToInt(endIp);
    return ipInt >= startInt && ipInt <= endInt;
};

/**
 * 验证IP列表输入并返回详细的错误信息
 * @param {string} str - IP列表字符串
 * @returns {Object} 包含有效IP数组和错误信息的对象
 */
const validateIpList = (str) => {
    const result = parseIpList(str, true);

    // 检查IP重复
    const duplicateErrors = checkDuplicateIps(result.ips);
    if (duplicateErrors.length > 0) {
        result.errors.push(...duplicateErrors);
    }

    return result;
};

/**
 * 检查IP数组中的重复IP地址
 * @param {string[]} ips - IP地址数组
 * @returns {string[]} 重复IP的错误信息数组
 */
const checkDuplicateIps = (ips) => {
    const errors = [];
    const ipCounts = {};

    // 统计每个IP出现的次数
    ips.forEach((ip) => {
        ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });

    // 找出重复的IP
    Object.entries(ipCounts).forEach(([ip, count]) => {
        if (count > 1) {
            errors.push(`IP地址重复：${ip} 出现了 ${count} 次，请检查不同IP段之间是否有重叠`);
        }
    });

    return errors;
};

module.exports = {
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
};
