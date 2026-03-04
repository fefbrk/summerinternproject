const CAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

const isCaptchaEnabled = () => {
  return process.env.ENABLE_LOGIN_CAPTCHA === 'true';
};

const getCaptchaMinScore = () => {
  const configured = Number(process.env.CAPTCHA_MIN_SCORE);
  if (Number.isFinite(configured)) {
    return Math.max(0, Math.min(1, configured));
  }

  return 0.5;
};

const verifyCaptchaToken = async ({ token, remoteIp }) => {
  if (!isCaptchaEnabled()) {
    return {
      success: true,
      reason: 'captcha-disabled',
    };
  }

  const secret = typeof process.env.CAPTCHA_SECRET === 'string'
    ? process.env.CAPTCHA_SECRET.trim()
    : '';

  if (!secret) {
    return {
      success: false,
      reason: 'captcha-secret-missing',
    };
  }

  if (typeof token !== 'string' || token.trim().length === 0) {
    return {
      success: false,
      reason: 'captcha-token-missing',
    };
  }

  const payload = new URLSearchParams();
  payload.set('secret', secret);
  payload.set('response', token.trim());
  if (typeof remoteIp === 'string' && remoteIp.trim().length > 0) {
    payload.set('remoteip', remoteIp.trim());
  }

  try {
    const response = await fetch(CAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      return {
        success: false,
        reason: 'captcha-provider-http-error',
      };
    }

    const result = await response.json().catch(() => ({}));
    const score = Number(result.score);
    const minScore = getCaptchaMinScore();
    if (!result.success) {
      return {
        success: false,
        reason: 'captcha-provider-rejected',
      };
    }

    if (Number.isFinite(score) && score < minScore) {
      return {
        success: false,
        reason: 'captcha-score-too-low',
      };
    }

    return {
      success: true,
      reason: 'captcha-verified',
    };
  } catch (_error) {
    return {
      success: false,
      reason: 'captcha-provider-unreachable',
    };
  }
};

module.exports = {
  isCaptchaEnabled,
  verifyCaptchaToken,
};
