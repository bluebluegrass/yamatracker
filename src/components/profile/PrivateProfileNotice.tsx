interface PrivateProfileNoticeProps {
  displayName?: string | null;
  slug: string;
}

export function PrivateProfileNotice({ displayName, slug }: PrivateProfileNoticeProps) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-amber-900">
        {displayName ?? slug} keeps this profile private
      </h1>
      <p className="mt-4 text-sm text-amber-800">
        The owner has chosen not to share their progress publicly at the moment. Check back later or ask them
        to enable public sharing from their dashboard.
      </p>
    </div>
  );
}
