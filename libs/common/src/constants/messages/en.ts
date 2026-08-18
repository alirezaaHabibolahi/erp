export const en = {
    AUTH: {
        INVALID_TOKEN: 'Invalid authentication token.',
        TOKEN_EXPIRED: 'Authentication token has expired.',
        UNAUTHORIZED: 'You are not authorized to perform this action.',
        OTP_CODE: 'OTP code is resent successfully',
        OTP_CODE_IS_NOT_VALID: 'Otp is not valid or it is expired',
        PASS_OR_USERNAME_IS_INVALID: "Username or password is not correct"
    },
    USER: {
        NOT_FOUND: 'User not found.',
        ALREADY_EXISTS: 'User already exists.',
        INVALID_PHONE: 'Phone number format is invalid.',
        INVALID_EMAIL: 'Email address is invalid.',
        DUPLICATE_USER_NAME: 'Username is exist',
        NOT_EQUAL_PASSWORD: 'Password and confirmPassword are not equal',
        CREATED_SUCCESSFULLY: "User is created successfully",
        EMAIL_IS_USED: "Email is used",
        PHONE_IS_USED: 'Phone is used',

    },
    OTP: {
        INVALID: 'Invalid OTP code.',
        EXPIRED: 'OTP code has expired.',
        NOT_SENT: 'OTP code could not be sent.',
    },
    DATABASE: {
        CONNECTION_FAILED: 'Could not connect to the database.',
        DUPLICATE_KEY: 'Duplicate entry detected in the database.',
    },
    GENERAL: {
        UNKNOWN_ERROR: 'An unexpected error occurred.',
        VALIDATION_FAILED: 'Validation failed for one or more fields.',
        FORBIDDEN: 'Access forbidden.',
    },

    VALIDATION: {

        AUTH: {
            PASSWORD_STRING: 'Password must be a string.',
            PASSWORD_MINLENGTH: 'Password must be at least 8 characters long.',
            PASSWORD_MAXLENGTH: 'Password cannot exceed 32 characters.',
            PASSWORD_COMPLEXITY:
                'Password must contain uppercase, lowercase, number, and special character.',
            PASSWORD_CONFIRM_STRING: 'Confirm password must be a string.',
            PASSWORD_MISMATCH: 'Password and confirm password do not match.',
        },
        USER: {
            USERNAME_STRING: 'Username must be a string.',
            USERNAME_REQUIRED: 'Username is required.',
            USERNAME_MINLENGTH: 'Username must be at least 3 characters long.',
            USERNAME_MAXLENGTH: 'Username cannot exceed 20 characters.',
            FIRSTNAME_STRING: 'First name must be a string.',
            FIRSTNAME_MAXLENGTH: 'First name cannot exceed 30 characters.',
            LASTNAME_STRING: 'Last name must be a string.',
            LASTNAME_MAXLENGTH: 'Last name cannot exceed 30 characters.',
            PHONE_PATTERN: 'Phone number must be 11 digits and start with 0.',
            EMAIL_INVALID: 'Email address is not valid.',
        },
    },
};
