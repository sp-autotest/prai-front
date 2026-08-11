"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/container/container";
import { Button } from "@/components/ui/button/button";
import { Card } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { fetchLogin } from "@/lib/api/auth/login";
import { fetchRegister, validateRegisterPassword } from "@/lib/api/auth/register";
import { saveAuthSession } from "@/lib/auth/session";
import type { Locale } from "@/types";
import type { RegisterClientErrorCode } from "@/types/auth";
import styles from "../login-form/login-form.module.css";

const EMAIL_MAX_LENGTH = 254;
const NICKNAME_MAX_LENGTH = 64;

type SignupFormProps = {
  locale: Locale;
};

type FieldErrors = {
  nickname?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
};

/**
 * Sign-up form matching ``POST /api/v1/auth/register/`` (nickname + email + password).
 * On success auto-signs in via login and navigates to the account page.
 * @param {SignupFormProps} props - Locale for post-register redirect and links.
 * @returns {React.ReactElement} Signup form UI.
 */
export const SignupForm = ({ locale }: SignupFormProps) => {
  const t = useTranslations("signupPage");
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fieldError, setFieldError] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validates fields against OpenAPI RegisterRequest + password policy.
   * @returns {boolean} `true` when the form may be submitted.
   */
  const validateFields = (): boolean => {
    const nextErrors: FieldErrors = {};
    const trimmedNickname = nickname.trim();
    const trimmedEmail = email.trim();

    if (!trimmedNickname) {
      nextErrors.nickname = t("errors.nicknameRequired");
    } else if (trimmedNickname.length > NICKNAME_MAX_LENGTH) {
      nextErrors.nickname = t("errors.nicknameMax");
    }

    if (!trimmedEmail) {
      nextErrors.email = t("errors.emailRequired");
    } else if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      nextErrors.email = t("errors.emailMax");
    }

    if (!password) {
      nextErrors.password = t("errors.passwordRequired");
    } else if (validateRegisterPassword(password)) {
      nextErrors.password = t("errors.passwordPolicy");
    }

    if (!passwordConfirm) {
      nextErrors.passwordConfirm = t("errors.passwordConfirmRequired");
    } else if (passwordConfirm !== password) {
      nextErrors.passwordConfirm = t("errors.passwordMismatch");
    }

    setFieldError(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Maps API client error codes to localized messages.
   * @param {RegisterClientErrorCode} code - Failure code from the register client.
   * @returns {string} Localized error text.
   */
  const getErrorMessage = (code: RegisterClientErrorCode): string => {
    return t(`errors.${code}`);
  };

  /**
   * Submits registration to the auth BFF, then signs in and redirects.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await fetchRegister({ nickname, email, password });

      if (!result.ok) {
        setFormError(getErrorMessage(result.code));
        return;
      }

      const loginResult = await fetchLogin({ email, password });

      if (!loginResult.ok) {
        router.push(`/${locale}/login`);
        return;
      }

      saveAuthSession(loginResult.value);
      router.push(`/${locale}/account`);
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Updates nickname and clears related errors.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   */
  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value);
    if (fieldError.nickname || formError) {
      setFieldError((prev) => ({ ...prev, nickname: undefined }));
      setFormError("");
    }
  };

  /**
   * Updates email and clears related errors.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   */
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    if (fieldError.email || formError) {
      setFieldError((prev) => ({ ...prev, email: undefined }));
      setFormError("");
    }
  };

  /**
   * Updates password and clears related errors.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   */
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (fieldError.password || formError) {
      setFieldError((prev) => ({ ...prev, password: undefined }));
      setFormError("");
    }
  };

  /**
   * Updates password confirmation and clears related errors.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   */
  const handlePasswordConfirmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordConfirm(event.target.value);
    if (fieldError.passwordConfirm || formError) {
      setFieldError((prev) => ({ ...prev, passwordConfirm: undefined }));
      setFormError("");
    }
  };

  return (
    <div className={styles.page}>
      <Container narrow>
        <Card elevated padding="lg" className={styles.page__card}>
          <h1 className={styles.page__title}>{t("title")}</h1>
          <p className={styles.page__description}>{t("description")}</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.form__field}>
              <label htmlFor="signup-nickname" className={styles.form__label}>
                {t("nicknameLabel")}
              </label>
              <Input
                id="signup-nickname"
                name="nickname"
                type="text"
                value={nickname}
                onChange={handleNicknameChange}
                ariaLabel={t("nicknameLabel")}
                autoComplete="nickname"
                maxLength={NICKNAME_MAX_LENGTH}
                required
                disabled={isSubmitting}
                error={fieldError.nickname}
              />
            </div>

            <div className={styles.form__field}>
              <label htmlFor="signup-email" className={styles.form__label}>
                {t("emailLabel")}
              </label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                ariaLabel={t("emailLabel")}
                autoComplete="email"
                maxLength={EMAIL_MAX_LENGTH}
                required
                disabled={isSubmitting}
                error={fieldError.email}
              />
            </div>

            <div className={styles.form__field}>
              <label htmlFor="signup-password" className={styles.form__label}>
                {t("passwordLabel")}
              </label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                ariaLabel={t("passwordLabel")}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                error={fieldError.password}
              />
              <p className={styles.page__description}>{t("passwordHint")}</p>
            </div>

            <div className={styles.form__field}>
              <label htmlFor="signup-password-confirm" className={styles.form__label}>
                {t("passwordConfirmLabel")}
              </label>
              <Input
                id="signup-password-confirm"
                name="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={handlePasswordConfirmChange}
                ariaLabel={t("passwordConfirmLabel")}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                error={fieldError.passwordConfirm}
              />
            </div>

            {formError ? (
              <p className={styles.form__error} role="alert">
                {formError}
              </p>
            ) : null}

            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>

          <p className={styles.page__description}>
            {t("haveAccount")}{" "}
            <Link href={`/${locale}/login`} prefetch>
              {t("signInLink")}
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
};
