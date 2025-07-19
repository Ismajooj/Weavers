import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  Filter,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'success' | 'error' | 'pending';
  startTime: string;
  endTime?: string;
  duration?: number;
  trigger: string;
  steps: Array<{
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    duration?: number;
    input?: any;
    output?: any;
    error?: string;
  }>;
  error?: string;
  input?: any;
  output?: any;
}

interface ExecutionMonitorProps {
  workflows: Array<{ id: string; name: string }>;
}

export function ExecutionMonitor({ workflows }: ExecutionMonitorProps) {
  const [executions, setExecutions] = useState<ExecutionLog[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWorkflow, setFilterWorkflow] = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<ExecutionLog | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Simular dados de execução
  useEffect(() => {
    const generateMockExecutions = () => {
      const statuses: ExecutionLog['status'][] = ['success', 'error', 'running', 'pending'];
      const triggers = ['webhook', 'schedule', 'manual'];
      
      const mockExecutions: ExecutionLog[] = Array.from({ length: 15 }, (_, i) => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const workflow = workflows[Math.floor(Math.random() * workflows.length)] || { id: '1', name: 'Sample Workflow' };
        const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
        const duration = status === 'running' ? undefined : Math.floor(Math.random() * 5000) + 100;
        
        return {
          id: `exec-${i + 1}`,
          workflowId: workflow.id,
          workflowName: workflow.name,
          status,
          startTime,
          endTime: status === 'running' ? undefined : new Date(new Date(startTime).getTime() + (duration || 0)).toISOString(),
          duration,
          trigger: triggers[Math.floor(Math.random() * triggers.length)],
          steps: [
            {
              name: 'Receber dados',
              status: 'success',
              duration: 50,
              input: { webhook: 'data received' },
              output: { parsed: true }
            },
            {
              name: 'Processar',
              status: status === 'error' ? 'error' : 'success',
              duration: status === 'error' ? undefined : 150,
              error: status === 'error' ? 'Invalid data format' : undefined
            },
            {
              name: 'Salvar resultado',
              status: status === 'error' ? 'pending' : 'success',
              duration: status === 'error' ? undefined : 75
            }
          ],
          error: status === 'error' ? 'Falha no processamento dos dados' : undefined,
          input: { data: 'sample input' },
          output: status === 'success' ? { result: 'processed successfully' } : undefined
        };
      });

      setExecutions(mockExecutions);
    };

    generateMockExecutions();
    
    if (isAutoRefresh) {
      const interval = setInterval(generateMockExecutions, 5000);
      return () => clearInterval(interval);
    }
  }, [workflows, isAutoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      case 'running': return Activity;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'status-active';
      case 'error': return 'status-error';
      case 'running': return 'status-pending';
      case 'pending': return 'status-inactive';
      default: return 'status-inactive';
    }
  };

  const filteredExecutions = executions.filter(exec => {
    const statusMatch = filterStatus === 'all' || exec.status === filterStatus;
    const workflowMatch = filterWorkflow === 'all' || exec.workflowId === filterWorkflow;
    return statusMatch && workflowMatch;
  });

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          Monitor de Execuções
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            {isAutoRefresh ? 'Auto' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="running">Executando</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterWorkflow} onValueChange={setFilterWorkflow}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Workflow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Workflows</SelectItem>
              {workflows.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-status-active"></div>
              {executions.filter(e => e.status === 'success').length} Sucessos
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-status-error"></div>
              {executions.filter(e => e.status === 'error').length} Erros
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-status-pending"></div>
              {executions.filter(e => e.status === 'running').length} Executando
            </span>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Execution List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Execuções Recentes</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
          
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredExecutions.map((execution) => {
                const StatusIcon = getStatusIcon(execution.status);
                
                return (
                  <div
                    key={execution.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/40 ${
                      selectedExecution?.id === execution.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSelectedExecution(execution)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${
                            execution.status === 'success' ? 'text-success' :
                            execution.status === 'error' ? 'text-destructive' :
                            execution.status === 'running' ? 'text-warning' :
                            'text-muted-foreground'
                          }`} />
                          <span className="font-medium text-sm">{execution.workflowName}</span>
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status === 'success' ? 'Sucesso' :
                             execution.status === 'error' ? 'Erro' :
                             execution.status === 'running' ? 'Executando' : 'Pendente'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>ID: {execution.id}</span>
                          <span>Trigger: {execution.trigger}</span>
                          <span>Duração: {formatDuration(execution.duration)}</span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {formatTime(execution.startTime)}
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Execution Details */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Detalhes da Execução</h3>
          
          {selectedExecution ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Workflow:</span>
                  <p className="font-medium">{selectedExecution.workflowName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(selectedExecution.status)}>
                    {selectedExecution.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Início:</span>
                  <p>{formatTime(selectedExecution.startTime)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duração:</span>
                  <p>{formatDuration(selectedExecution.duration)}</p>
                </div>
              </div>

              {selectedExecution.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">Erro:</p>
                  <p className="text-sm text-destructive">{selectedExecution.error}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">Etapas do Pipeline:</h4>
                {selectedExecution.steps.map((step, index) => {
                  const StepIcon = getStatusIcon(step.status);
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <StepIcon className={`h-4 w-4 ${
                        step.status === 'success' ? 'text-success' :
                        step.status === 'error' ? 'text-destructive' :
                        step.status === 'running' ? 'text-warning' :
                        'text-muted-foreground'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.name}</p>
                        {step.error && (
                          <p className="text-xs text-destructive">{step.error}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(step.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {(selectedExecution.input || selectedExecution.output) && (
                <div className="space-y-3">
                  <h4 className="font-medium">Dados:</h4>
                  {selectedExecution.input && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Entrada:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                        {JSON.stringify(selectedExecution.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedExecution.output && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Saída:</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                        {JSON.stringify(selectedExecution.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma execução para ver os detalhes</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}