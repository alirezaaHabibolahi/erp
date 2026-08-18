export class StringHelper {
    static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    static slugify(str: string): string {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    }

    static maskPhone(phone: string): string {
        return phone.replace(/(\d{3})\d{4}(\d{2})/, '$1****$2');
    }

    static randomString(length = 8): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length })
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join('');
    }
}
