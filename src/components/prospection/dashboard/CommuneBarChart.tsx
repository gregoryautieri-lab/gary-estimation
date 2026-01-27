import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { PerformanceCommune } from '@/hooks/useProspectionDashboard';

interface CommuneBarChartProps {
  data: PerformanceCommune[];
}

export function CommuneBarChart({ data }: CommuneBarChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top 10 communes</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                layout="vertical"
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                />
                <YAxis 
                  type="category"
                  dataKey="commune"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [value.toLocaleString('fr-CH'), 'Courriers']}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
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
