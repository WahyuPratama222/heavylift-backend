type MemberWithLatestPackageStatus = {
  member_packages: { status: string }[];
} & Record<string, unknown>;

export function mapMemberStatus<T extends MemberWithLatestPackageStatus>(
  member: T,
): Omit<T, 'member_packages'> & { status: string } {
  const { member_packages, ...rest } = member;

  let derivedStatus: string;
  if (member_packages.length === 0) {
    derivedStatus = 'no_package';
  } else {
    const latestStatus = member_packages[0].status;
    if (latestStatus === 'active') {
      derivedStatus = 'active';
    } else if (latestStatus === 'pending_payment') {
      derivedStatus = 'pending_payment';
    } else {
      derivedStatus = 'expired';
    }
  }

  return { ...rest, status: derivedStatus };
}