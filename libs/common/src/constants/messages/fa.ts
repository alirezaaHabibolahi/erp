export const fa = {
  AUTH: {
    INVALID_TOKEN: 'توکن احراز هویت نامعتبر است.',
    TOKEN_EXPIRED: 'توکن احراز هویت منقضی شده است.',
    UNAUTHORIZED: 'شما مجاز به انجام این عملیات نیستید.',
    OTP_CODE: 'کد احراز هویت با موفقیت ارسال شد',
    OTP_CODE_IS_NOT_VALID: 'کد تایید اشتباه است و یا منقضی شده است',
    PASS_OR_USERNAME_IS_INVALID: 'نام کاربری یا رمز عبور اشتباه است',
  },
  USER: {
    NOT_FOUND: 'کاربر پیدا نشد.',
    ALREADY_EXISTS: 'کاربر از قبل وجود دارد.',
    INVALID_PHONE: 'فرمت شماره تلفن معتبر نیست.',
    INVALID_EMAIL: 'آدرس ایمیل معتبر نیست.',
    DUPLICATE_USER_NAME: 'نام کاربری تکراری است',
    NOT_EQUAL_PASSWORD: 'رمز عبور و تکرار رمر عبور با هم برابر نیستند',
    CREATED_SUCCESSFULLY: 'کاربر با موفقیت ساخته شد',
    EMAIL_IS_USED: 'ایمیل تکراری است',
    PHONE_IS_USED: 'شماره موبایل تکراری است',
  },
  OTP: {
    INVALID: 'کد تایید نامعتبر است.',
    EXPIRED: 'کد تایید منقضی شده است.',
    NOT_SENT: 'ارسال کد تایید با خطا مواجه شد.',
  },
  DATABASE: {
    CONNECTION_FAILED: 'اتصال به پایگاه داده برقرار نشد.',
    DUPLICATE_KEY: 'مقدار تکراری در پایگاه داده یافت شد.',
  },
  GENERAL: {
    UNKNOWN_ERROR: 'خطای غیرمنتظره‌ای رخ داده است.',
    SUCCESS: 'درخواست با موفقیت انجام شد.',
    BAD_REQUEST: 'درخواست نامعتبر است.',
    VALIDATION_FAILED: 'اعتبارسنجی یک یا چند فیلد با خطا مواجه شد.',
    FORBIDDEN: 'دسترسی غیرمجاز است.',
    NOT_FOUND: 'منبع مورد نظر پیدا نشد.',
    CONFLICT: 'درخواست با داده‌های موجود تداخل دارد.',
    TOO_MANY_REQUESTS:
      'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.',
  },

  VALIDATION: {
    AUTH: {
      PASSWORD_STRING: 'رمز عبور باید از نوع رشته باشد.',
      PASSWORD_MINLENGTH: 'رمز عبور باید حداقل ۸ کاراکتر باشد.',
      PASSWORD_MAXLENGTH: 'رمز عبور نمی‌تواند بیش از ۱۲۸ کاراکتر باشد.',
      PASSWORD_COMPLEXITY:
        'رمز عبور باید شامل حروف بزرگ، کوچک، عدد و کاراکتر خاص باشد.',
      PASSWORD_CONFIRM_STRING: 'تأیید رمز عبور باید از نوع رشته باشد.',
      PASSWORD_MISMATCH: 'رمز عبور و تأیید آن یکسان نیستند.',
    },
    USER: {
      USERNAME_STRING: 'نام کاربری باید از نوع رشته باشد.',
      USERNAME_REQUIRED: 'نام کاربری الزامی است.',
      USERNAME_MINLENGTH: 'نام کاربری باید حداقل ۳ کاراکتر باشد.',
      USERNAME_MAXLENGTH: 'نام کاربری نمی‌تواند بیش از ۲۰ کاراکتر باشد.',
      FIRSTNAME_STRING: 'نام باید از نوع رشته باشد.',
      FIRSTNAME_MAXLENGTH: 'نام نمی‌تواند بیش از ۸۰ کاراکتر باشد.',
      LASTNAME_STRING: 'نام خانوادگی باید از نوع رشته باشد.',
      LASTNAME_MAXLENGTH: 'نام خانوادگی نمی‌تواند بیش از ۸۰ کاراکتر باشد.',
      PHONE_PATTERN: 'شماره تلفن باید ۱۱ رقم باشد و با ۰ شروع شود.',
      EMAIL_INVALID: 'ایمیل معتبر نیست.',
    },
  },
};
