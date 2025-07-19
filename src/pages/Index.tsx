import { useState } from 'react';
import { WeaverHeader } from '@/components/WeaverHeader';
import { PromptInterface } from '@/components/PromptInterface';
import { WorkflowDashboard } from '@/components/WorkflowDashboard';
import { DataProcessor } from '@/components/DataProcessor';
import { ExecutionMonitor } from '@/components/ExecutionMonitor';

interface Workflow {
  id: string;
  name: string;
  prompt: string;
  status: 'active' | 'paused' | 'error';
  created: string;
  trigger: {
    type: string;
    config: any;
  };
  actions: Array<{
    type: string;
    operation?: string;
    target?: string;
  }>;
  executions: number;
  lastRun?: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('automation');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const handleWorkflowCreate = (workflow: Workflow) => {
    setWorkflows(prev => [workflow, ...prev]);
  };

  const handleWorkflowUpdate = (updatedWorkflows: Workflow[]) => {
    setWorkflows(updatedWorkflows);
  };

  const handleWorkflowEdit = (workflow: Workflow) => {
    // TODO: Implementar editor de workflow
    console.log('Edit workflow:', workflow);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'automation':
        return (
          <div className="space-y-8">
            <PromptInterface onWorkflowCreate={handleWorkflowCreate} />
            <WorkflowDashboard 
              workflows={workflows}
              onWorkflowUpdate={handleWorkflowUpdate}
              onWorkflowEdit={handleWorkflowEdit}
            />
          </div>
        );
      case 'processor':
        return <DataProcessor />;
      case 'monitor':
        return <ExecutionMonitor workflows={workflows} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <WeaverHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 py-8">
        {renderActiveTab()}
      </main>
      
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>
    </div>
  );
};

export default Index;
