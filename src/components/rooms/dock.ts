export type DockStep = 'signIn' | 'pick' | 'pickTwo' | 'pickKind' | 'read';

export function dockStep(s: { signedIn: boolean; hasSubject: boolean; needPartner: boolean; chosen: number }): DockStep {
  if (!s.signedIn) return 'signIn';
  if (!s.hasSubject) return 'pick';
  if (s.needPartner) return s.chosen >= 2 ? 'pickKind' : 'pickTwo';
  return 'read';
}
