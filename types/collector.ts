export interface Collector {
  id: number;
  code: string;
  name: string;
}

export const processCollectors = (collectors: any[]): Collector[] => {
  return collectors.map((collector: any) => ({
    id: collector.collector_id,
    name: collector.collector_name,
    code: collector.collector_identity,
  }));
};
