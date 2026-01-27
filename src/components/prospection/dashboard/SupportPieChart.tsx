import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { RepartitionSupport } from '@/hooks/useProspectionDashboard';

interface SupportPieChartProps {
  data: RepartitionSupport[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(217 91% 60%)', // blue
  'hsl(280 65% 60%)', // purple
];

export function SupportPieChart({ data }: SupportPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Répartition par support</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[200px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString('fr-CH')} (${total > 0 ? Math.round((value/total)*100) : 0}%)`,
                    name
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Aucune donnée
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
