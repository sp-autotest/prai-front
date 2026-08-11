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
import { saveAuthSession } from "@/lib/auth/session";
import type { Locale } from "@/types";
import type { LoginClientErrorCode } from "@/types/auth";
import styles from "./login-form.module.css";

const EMAIL_MAX_LENGTH = 254;

type LoginFormProps = {
  locale: Locale;
};

/**
 * Sign-in form matching ``POST /api/v1/auth/login/`` (email + password).
 * On success stores the token session and navigates to the account page.
 * @param {LoginFormProps} props - Locale for post-login redirect.
 * @returns {React.ReactElement} Login form UI.
 */
export const LoginForm = ({ locale }: LoginFormProps) => {
  const t = useTranslations("loginPage");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validates fields against OpenAPI LoginRequest constraints before submit.
   * @returns {boolean} `true` when the form may be submitted.
   */
  const validateFields = (): boolean => {
    const nextErrors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = t("errors.emailRequired");
    } else if (trimmedEmail.length > EMAIL_MAX_LENGTH) {
      nextErrors.email = t("errors.emailMax");
    }

    if (!password) {
      nextErrors.password = t("errors.passwordRequired");
    }

    setFieldError(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /**
   * Maps API client error codes to localized messages.
   * @param {LoginClientErrorCode} code - Failure code from the login client.
   * @returns {string} Localized error text.
   */
  const getErrorMessage = (code: LoginClientErrorCode): string => {
    return t(`errors.${code}`);
  };

  /**
   * Submits credentials to the auth BFF and redirects on success.
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
      const result = await fetchLogin({ email, password });

      if (!result.ok) {
        setFormError(getErrorMessage(result.code));
        return;
      }

      saveAuthSession(result.value);
      router.push(`/${locale}/account`);
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Updates email and clears related field/form errors.
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
   * Updates password and clears related field/form errors.
   * @param {React.ChangeEvent<HTMLInputElement>} event - Input change event.
   */
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (fieldError.password || formError) {
      setFieldError((prev) => ({ ...prev, password: undefined }));
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
              <label htmlFor="login-email" className={styles.form__label}>
                {t("emailLabel")}
              </label>
              <Input
                id="login-email"
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
              <label htmlFor="login-password" className={styles.form__label}>
                {t("passwordLabel")}
              </label>
              <Input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                ariaLabel={t("passwordLabel")}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                error={fieldError.password}
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
            {t("noAccount")}{" "}
            <Link href={`/${locale}/signup`} prefetch>
              {t("signUpLink")}
            </Link>
          </p>
        </Card>
      </Container>
    </div>
  );
};
