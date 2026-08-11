"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button/button";
import { Card } from "@/components/ui/card/card";
import { Input } from "@/components/ui/input/input";
import { fetchProfile, updateProfile } from "@/lib/api/profile/client";
import {
  clearAuthSession,
  getAuthSession,
  updateAuthSessionUser,
} from "@/lib/auth/session";
import type { Locale } from "@/types";
import type { UserPublic } from "@/types/auth";
import styles from "./profile-panel.module.css";

const EMAIL_MAX = 254;
const NICKNAME_MAX = 64;

type ProfilePanelProps = {
  locale: Locale;
};

/**
 * Account profile panel: load, display, and patch user fields via the profile API.
 * @param {ProfilePanelProps} props - Locale for unauthorized redirect.
 * @returns {React.ReactElement} Profile form UI.
 */
export const ProfilePanel = ({ locale }: ProfilePanelProps) => {
  const t = useTranslations("accountPage");
  const router = useRouter();
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "saving">("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getAuthSession();

    if (!session) {
      router.replace(`/${locale}/login`);
      return;
    }

    let cancelled = false;

    /**
     * Loads profile from the BFF using the stored access token.
     */
    const loadProfile = async () => {
      const result = await fetchProfile(session.accessToken, session.tokenType);

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.code === "unauthorized") {
          clearAuthSession();
          router.replace(`/${locale}/login`);
          return;
        }

        setError(t("errors.loadFailed"));
        setStatus("ready");
        return;
      }

      setProfile(result.value);
      setEmail(result.value.email);
      setNickname(result.value.nickname);
      setStatus("ready");
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [locale, router, t]);

  /**
   * Submits changed profile fields to the API.
   * @param {React.FormEvent<HTMLFormElement>} event - Form submit event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const session = getAuthSession();

    if (!session) {
      router.replace(`/${locale}/login`);
      return;
    }

    const body: { email?: string; nickname?: string; password?: string } = {};
    const nextEmail = email.trim();
    const nextNickname = nickname.trim();

    if (!nextEmail || nextEmail.length > EMAIL_MAX) {
      setError(t("errors.emailInvalid"));
      return;
    }

    if (!nextNickname || nextNickname.length > NICKNAME_MAX) {
      setError(t("errors.nicknameInvalid"));
      return;
    }

    if (!profile || nextEmail !== profile.email) {
      body.email = nextEmail;
    }

    if (!profile || nextNickname !== profile.nickname) {
      body.nickname = nextNickname;
    }

    if (password) {
      body.password = password;
    }

    if (Object.keys(body).length === 0) {
      setMessage(t("noChanges"));
      return;
    }

    setStatus("saving");

    const result = await updateProfile(session.accessToken, body, session.tokenType);

    if (!result.ok) {
      if (result.code === "unauthorized") {
        clearAuthSession();
        router.replace(`/${locale}/login`);
        return;
      }

      setError(t(`errors.${result.code === "invalid" ? "invalid" : "saveFailed"}`));
      setStatus("ready");
      return;
    }

    setProfile({
      id: result.value.id,
      email: result.value.email,
      nickname: result.value.nickname,
      created_at: profile?.created_at ?? result.value.updated_at,
    });
    setEmail(result.value.email);
    setNickname(result.value.nickname);
    setPassword("");
    updateAuthSessionUser({
      id: result.value.id,
      email: result.value.email,
      nickname: result.value.nickname,
    });
    setMessage(t("saveSuccess"));
    setStatus("ready");
  };

  if (status === "loading" && !profile) {
    return (
      <Card elevated padding="lg" className={styles.panel}>
        <p className={styles.panel__status} role="status">
          {t("loading")}
        </p>
      </Card>
    );
  }

  return (
    <Card elevated padding="lg" className={styles.panel}>
      <div className={styles.panel__heading}>
        <h1 className={styles.panel__title}>{t("profileTitle")}</h1>
        <p className={styles.panel__subtitle}>{t("profileSubtitle")}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.form__field}>
          <label htmlFor="profile-nickname" className={styles.form__label}>
            {t("nicknameLabel")}
          </label>
          <Input
            id="profile-nickname"
            name="nickname"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            ariaLabel={t("nicknameLabel")}
            maxLength={NICKNAME_MAX}
            disabled={status === "saving"}
            required
          />
        </div>

        <div className={styles.form__field}>
          <label htmlFor="profile-email" className={styles.form__label}>
            {t("emailLabel")}
          </label>
          <Input
            id="profile-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            ariaLabel={t("emailLabel")}
            autoComplete="email"
            maxLength={EMAIL_MAX}
            disabled={status === "saving"}
            required
          />
        </div>

        <div className={styles.form__field}>
          <label htmlFor="profile-password" className={styles.form__label}>
            {t("passwordLabel")}
          </label>
          <Input
            id="profile-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            ariaLabel={t("passwordLabel")}
            autoComplete="new-password"
            disabled={status === "saving"}
          />
          <p className={styles.form__hint}>{t("passwordHint")}</p>
        </div>

        {profile?.created_at ? (
          <p className={styles.form__meta}>
            {t("createdAt", {
              value: new Date(profile.created_at).toLocaleString(),
            })}
          </p>
        ) : null}

        {error ? (
          <p className={styles.form__error} role="alert">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className={styles.form__success} role="status">
            {message}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" disabled={status === "saving"}>
          {status === "saving" ? t("saving") : t("save")}
        </Button>
      </form>
    </Card>
  );
};
