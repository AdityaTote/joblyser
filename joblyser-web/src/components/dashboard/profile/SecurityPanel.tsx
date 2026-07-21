import {
  EyeIcon,
  EyeOffIcon,
} from "@/components/dashboard/profile/ProfileIcons";

interface PasswordForm {
  current: string;
  newPass: string;
  confirm: string;
}

interface PasswordStrength {
  width: string;
  color: string;
  label: string;
}

interface SecurityPanelProps {
  passwordForm: PasswordForm;
  showPassword: { current: boolean; newPass: boolean; confirm: boolean };
  strength: PasswordStrength;
  passwordsMatch: boolean;
  isPasswordFormValid: boolean;
  passwordSuccess: boolean;
  onToggleShow: (field: "current" | "newPass" | "confirm") => void;
  onChangePasswordForm: (next: PasswordForm) => void;
  onSubmit: () => void;
}

export default function SecurityPanel({
  passwordForm,
  showPassword,
  strength,
  passwordsMatch,
  isPasswordFormValid,
  passwordSuccess,
  onToggleShow,
  onChangePasswordForm,
  onSubmit,
}: SecurityPanelProps) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-white text-base font-semibold mb-5">Security</h2>

      <div className="flex flex-col gap-5">
        <div>
          <label className="text-zinc-400 text-sm mb-1 block">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPassword.current ? "text" : "password"}
              value={passwordForm.current}
              onChange={(e) =>
                onChangePasswordForm({
                  ...passwordForm,
                  current: e.target.value,
                })
              }
              className="w-full bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white rounded-none p-4 pr-12 transition-all placeholder-zinc-700 font-sans text-base focus:outline-none"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              onClick={() => onToggleShow("current")}
            >
              {showPassword.current ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-zinc-400 text-sm mb-1 block">
            New Password
          </label>
          <div className="relative mb-2">
            <input
              type={showPassword.newPass ? "text" : "password"}
              value={passwordForm.newPass}
              onChange={(e) =>
                onChangePasswordForm({
                  ...passwordForm,
                  newPass: e.target.value,
                })
              }
              className="w-full bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white rounded-none p-4 pr-12 transition-all placeholder-zinc-700 font-sans text-base focus:outline-none"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              onClick={() => onToggleShow("newPass")}
            >
              {showPassword.newPass ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="flex-1 mr-4">
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.width} ${strength.color} transition-all duration-300`}
                ></div>
              </div>
            </div>
            <span
              className={`${strength.color.replace("bg-", "text-")} font-medium w-10 text-right`}
            >
              {strength.label}
            </span>
          </div>
        </div>

        <div>
          <label className="text-zinc-400 text-sm mb-1 block">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPassword.confirm ? "text" : "password"}
              value={passwordForm.confirm}
              onChange={(e) =>
                onChangePasswordForm({
                  ...passwordForm,
                  confirm: e.target.value,
                })
              }
              className="w-full bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white rounded-none p-4 pr-12 transition-all placeholder-zinc-700 font-sans text-base focus:outline-none"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              onClick={() => onToggleShow("confirm")}
            >
              {showPassword.confirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {passwordForm.confirm.length > 0 && !passwordsMatch && (
            <p className="text-red-400 text-xs mt-1.5 font-medium">
              Passwords do not match
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onSubmit}
            disabled={!isPasswordFormValid}
            className={`font-semibold text-sm rounded-xl px-6 py-2.5 transition-all ${
              isPasswordFormValid
                ? "bg-amber-400 text-[#0a0a0a] hover:bg-amber-300"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
            }`}
          >
            Update Password
          </button>

          {passwordSuccess && (
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
              ✓ Password updated successfully
            </span>
          )}
        </div>
        <p className="text-zinc-600 text-xs mt-3">
          Use at least 8 characters with a mix of letters, numbers and symbols.
        </p>
      </div>
    </section>
  );
}
