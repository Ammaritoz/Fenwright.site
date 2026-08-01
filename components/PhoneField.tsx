"use client";

import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

type Props = {
  /** id applied to the actual number input, for label association */
  id: string;
  /** current value, E.164 (e.g. +35387...) or "" */
  value: string;
  /** called with a normalised E.164 string, or "" while incomplete */
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

/**
 * Accessible international phone input: a country selector with real SVG flags
 * (default Ireland) plus a number field that accepts almost any format and
 * normalises to E.164. Shows inline valid/invalid confirmation. Flags bundled
 * locally (no external requests).
 */
export function PhoneField({ id, value, onChange, placeholder, ariaLabel }: Props) {
  const [touched, setTouched] = useState(false);
  // Track whether the raw field has any digits, so an unparseable number (which
  // the library reports as empty) can still show an "invalid" message.
  const [rawHasDigits, setRawHasDigits] = useState(false);

  const valid = Boolean(value) && isValidPhoneNumber(value);
  const showError = touched && rawHasDigits && !valid;
  const statusId = `${id}-status`;

  return (
    <div>
      <div
        className={`fw-phone ${showError ? "fw-phone--error" : ""}`}
        onBlur={() => setTouched(true)}
        onInput={(e) => {
          const t = e.target as HTMLInputElement;
          if (t.classList?.contains("PhoneInputInput")) {
            setRawHasDigits(/\d/.test(t.value));
          }
        }}
      >
        <PhoneInput
          defaultCountry="IE"
          flags={flags}
          value={value || undefined}
          onChange={(v) => onChange(v || "")}
          placeholder={placeholder}
          numberInputProps={{
            id,
            "aria-label": ariaLabel || "Phone number",
            "aria-describedby": valid || showError ? statusId : undefined,
            "aria-invalid": showError || undefined,
          }}
          countrySelectProps={{ "aria-label": "Country code" }}
        />
      </div>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {valid && (
          <p id={statusId} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-stone-700">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#1F6B4E" />
              <path d="M8 12.5l2.5 2.5L16 9.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            That number looks good.
          </p>
        )}
        {showError && (
          <p id={statusId} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#DC2626" />
              <path d="M12 7v6M12 16.5v.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            That does not look right. Check the country flag and number.
          </p>
        )}
      </div>
    </div>
  );
}
