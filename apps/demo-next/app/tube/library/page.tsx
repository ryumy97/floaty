import { History } from '../TubeShell';

export default function Library() {
  return (
    <div className="tube-page narrow">
      <h1 className="tube-title">Recently watched</h1>
      <History />
    </div>
  );
}
