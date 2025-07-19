import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Eye, 
  Edit, 
  Trash2, 
  Activity, 
  Clock,
  Zap,
  Database,
  Globe,
  ArrowRight,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

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

interface WorkflowDashboardProps {
  workflows: Workflow[];
  onWorkflowUpdate: (workflows: Workflow[]) => void;
  onWorkflowEdit: (workflow: Workflow) => void;
}

export function WorkflowDashboard({ workflows, onWorkflowUpdate, onWorkflowEdit }: WorkflowDashboardProps) {
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'paused': return 'status-inactive';
      case 'error': return 'status-error';
      default: return 'status-inactive';
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'webhook': return Globe;
      case 'schedule': return Clock;
      case 'manual': return Play;
      default: return Zap;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'database': return Database;
      case 'extract': return Zap;
      case 'notification': return Activity;
      default: return ArrowRight;
    }
  };

  const toggleWorkflowStatus = (id: string) => {
    const updated = workflows.map(w => {
      if (w.id === id) {
        const newStatus = w.status === 'active' ? 'paused' : 'active';
        toast({
          title: newStatus === 'active' ? "Workflow ativado" : "Workflow pausado",
          description: `${w.name} está agora ${newStatus === 'active' ? 'ativo' : 'pausado'}`,
        });
        return { ...w, status: newStatus as 'active' | 'paused' | 'error' };
      }
      return w;
    });
    onWorkflowUpdate(updated);
  };

  const deleteWorkflow = (id: string) => {
    const workflow = workflows.find(w => w.id === id);
    const updated = workflows.filter(w => w.id !== id);
    onWorkflowUpdate(updated);
    toast({
      title: "Workflow removido",
      description: `${workflow?.name} foi removido com sucesso`,
    });
  };

  const executeWorkflow = (id: string) => {
    const workflow = workflows.find(w => w.id === id);
    if (workflow) {
      const updated = workflows.map(w => 
        w.id === id 
          ? { ...w, executions: w.executions + 1, lastRun: new Date().toISOString() }
          : w
      );
      onWorkflowUpdate(updated);
      toast({
        title: "Workflow executado",
        description: `${workflow.name} foi executado manualmente`,
      });
    }
  };

  if (workflows.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Zap className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Nenhuma automação criada</h3>
          <p className="text-muted-foreground">
            Use o prompt acima para criar sua primeira automação
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📊 Automações Ativas</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-active"></div>
            {workflows.filter(w => w.status === 'active').length} Ativas
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-inactive"></div>
            {workflows.filter(w => w.status === 'paused').length} Pausadas
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-error"></div>
            {workflows.filter(w => w.status === 'error').length} Com Erro
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => {
          const TriggerIcon = getTriggerIcon(workflow.trigger.type);
          
          return (
            <Card key={workflow.id} className="automation-card">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <TriggerIcon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{workflow.name}</h3>
                    </div>
                    <Badge className={getStatusColor(workflow.status)}>
                      {workflow.status === 'active' ? '🟢 Ativo' : 
                       workflow.status === 'paused' ? '⏸️ Pausado' : 
                       '🔴 Erro'}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {workflow.prompt}
                  </p>

                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <span>Criado: {new Date(workflow.created).toLocaleDateString('pt-BR')}</span>
                    <span>Execuções: {workflow.executions}</span>
                    {workflow.lastRun && (
                      <span>Última execução: {new Date(workflow.lastRun).toLocaleString('pt-BR')}</span>
                    )}
                  </div>

                  {/* Workflow Visual */}
                  <div className="flex items-center gap-2 py-3 px-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TriggerIcon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">
                        {workflow.trigger.type === 'webhook' ? 'Webhook' :
                         workflow.trigger.type === 'schedule' ? 'Agendado' : 'Manual'}
                      </span>
                    </div>
                    
                    {workflow.actions.map((action, idx) => {
                      const ActionIcon = getActionIcon(action.type);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            <ActionIcon className="h-4 w-4 text-accent" />
                            <span className="text-xs">
                              {action.type === 'extract' ? 'Extrair' :
                               action.type === 'database' ? 'Salvar' :
                               action.type === 'notification' ? 'Notificar' :
                               action.type === 'report' ? 'Relatório' : 'Processar'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeWorkflow(workflow.id)}
                    disabled={workflow.status === 'error'}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onWorkflowEdit(workflow)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleWorkflowStatus(workflow.id)}>
                        {workflow.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}