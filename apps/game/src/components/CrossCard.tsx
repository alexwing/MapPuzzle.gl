import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { siteAsset } from "@mappuzzle/core";
import "./CrossCard.css";

/* Aviso de Centurion en forma de píldora, a la izquierda del botón de donar y a su misma altura.
   Se puede cerrar y, una vez cerrado, no vuelve a salir (se recuerda en este navegador).
   No interviene en el tablero. */
const DISMISS_KEY = "mappuzzle_cross_dismissed";

function CrossCard(): JSX.Element | null {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (hidden) return null;

  function close(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* sin almacenamiento: solo se oculta en esta sesión */
    }
    setHidden(true);
  }

  return (
    <div className="cross-card">
      <a
        className="cross-card-link"
        href="https://centurion.mappuzzle.xyz/"
        target="_blank"
        rel="noopener noreferrer"
        title={`${t("info.centurion")} Centurion: Vincere Mare Nostrum`}
      >
        <img src={siteAsset("centurion-192.png")} alt="" width={26} height={26} />
        <span className="cross-card-text">
          <b>Centurion</b>
          <small>{t("info.centurionSub")}</small>
        </span>
      </a>
      <button
        type="button"
        className="cross-card-close"
        aria-label={t("info.close")}
        onClick={close}
      >
        ×
      </button>
    </div>
  );
}

export default CrossCard;
