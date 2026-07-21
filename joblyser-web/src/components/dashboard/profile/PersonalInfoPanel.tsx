import { LockIcon } from "@/components/dashboard/profile/ProfileIcons";

interface ProfileForm {
  name: string;
  role: string;
  bio: string;
  email: string;
}

interface PersonalInfoPanelProps {
  isEditing: boolean;
  initials: string;
  profileForm: ProfileForm;
  tempProfile: ProfileForm;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChangeTemp: (next: ProfileForm) => void;
}

export default function PersonalInfoPanel({
  isEditing,
  initials,
  profileForm,
  tempProfile,
  onEdit,
  onCancel,
  onSave,
  onChangeTemp,
}: PersonalInfoPanelProps) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-base font-semibold">Personal Info</h2>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                className="text-zinc-400 text-sm px-4 py-1.5 hover:text-white transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="bg-amber-400 text-[#0a0a0a] text-sm font-semibold rounded-xl px-4 py-1.5 hover:bg-amber-300 transition-all border border-transparent"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="border border-zinc-700 text-zinc-300 text-sm font-medium rounded-xl px-4 py-1.5 hover:border-zinc-500 hover:text-white transition-all"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-amber-400 text-[#0a0a0a] font-bold text-xl flex items-center justify-center shrink-0">
            {initials}
          </div>
          {isEditing && (
            <button className="text-amber-400 text-xs hover:text-amber-300 transition-colors">
              Change Photo
            </button>
          )}
        </div>
        <div className="pt-1">
          <div className="text-white font-semibold text-base leading-snug">
            {profileForm.name}
          </div>
          <div className="text-zinc-400 text-sm">{profileForm.role}</div>
        </div>
      </div>

      <div className="flex flex-col border-t border-zinc-800 pt-2">
        {!isEditing ? (
          <>
            <div className="flex py-3 border-b border-zinc-800">
              <div className="text-zinc-500 text-sm w-32 shrink-0">
                Full Name
              </div>
              <div className="text-zinc-300 text-sm">{profileForm.name}</div>
            </div>
            <div className="flex py-3 border-b border-zinc-800">
              <div className="text-zinc-500 text-sm w-32 shrink-0">
                Role / Job Title
              </div>
              <div className="text-zinc-300 text-sm">{profileForm.role}</div>
            </div>
            <div className="flex py-3 border-b border-zinc-800">
              <div className="text-zinc-500 text-sm w-32 shrink-0">
                Bio / Description
              </div>
              <div className="text-zinc-300 text-sm">{profileForm.bio}</div>
            </div>
            <div className="flex items-center py-3">
              <div className="text-zinc-500 text-sm w-32 shrink-0">Email</div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 text-sm">
                  {profileForm.email}
                </span>
                <span className="flex items-center gap-1 text-zinc-600 text-xs">
                  <LockIcon strokeWidth="2.5" />
                  Cannot be changed
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-5 pt-3 pb-1">
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                value={tempProfile.name}
                onChange={(e) =>
                  onChangeTemp({ ...tempProfile, name: e.target.value })
                }
                className="w-full bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white rounded-none p-4 transition-all placeholder-zinc-700 font-sans text-base focus:outline-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">
                Role / Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                value={tempProfile.role}
                onChange={(e) =>
                  onChangeTemp({ ...tempProfile, role: e.target.value })
                }
                className="w-full bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white rounded-none p-4 transition-all placeholder-zinc-700 font-sans text-base focus:outline-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">
                Bio / Description
              </label>
              <textarea
                rows={3}
                placeholder="A short bio about yourself..."
                value={tempProfile.bio}
                onChange={(e) =>
                  onChangeTemp({ ...tempProfile, bio: e.target.value })
                }
                className="w-full min-h-[120px] bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white rounded-none p-4 resize-y transition-all placeholder-zinc-700 font-sans text-base focus:outline-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm mb-1 block">Email</label>
              <input
                type="email"
                disabled
                value={tempProfile.email}
                className="w-full bg-zinc-900/20 border border-zinc-800 text-zinc-600 rounded-none p-4 cursor-not-allowed font-sans text-base"
              />
              <p className="text-zinc-600 text-xs mt-1.5 flex items-center gap-1.5">
                <LockIcon strokeWidth="2.5" />
                Email cannot be changed.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
