import { TalkToSales } from '../ChatShell';

const PLANS = [
  { name: 'Free', price: '$0', points: ['Up to 3 projects', 'Community support'] },
  { name: 'Team', price: '$12', points: ['Unlimited projects', 'Roadmaps and insights', 'Chat support'] },
  { name: 'Enterprise', price: 'Custom', points: ['SSO and audit logs', 'Dedicated manager', '99.99% SLA'] },
];

export default function Pricing() {
  return (
    <div className="ex-page">
      <h1 className="ex-title">Pricing</h1>
      <ul className="acme-plans">
        {PLANS.map((plan) => (
          <li key={plan.name}>
            <strong>{plan.name}</strong>
            <span className="acme-price">{plan.price}</span>
            <ul>
              {plan.points.map((point) => (
                <li key={point}>✓ {point}</li>
              ))}
            </ul>
            {plan.name === 'Enterprise' && <TalkToSales>Talk to sales</TalkToSales>}
          </li>
        ))}
      </ul>
    </div>
  );
}
