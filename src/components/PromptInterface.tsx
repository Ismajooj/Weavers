import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Sparkles, Zap, Clock, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromptInterfaceProps {
  onWorkflowCreate: (workflow: any) => void;
}

export function PromptInterface({ onWorkflowCreate }: PromptInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const examplePrompts = [
    {
      icon: Zap,
      text: "Quando receber webhook com dados de formulário, extrair email e salvar no banco",
      category: "Webhook Automation"
    },
    {
      icon: Clock,
      text: "Todo dia às 9h, buscar dados da API e gerar relatório em CSV",
      category: "Scheduled Task"
    },
    {
      icon: Database,
      text: "Monitorar API externa a cada 5 minutos e alertar se falhar",
      category: "API Monitoring"
    }
  ];

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Descreva a automação que você quer criar",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simular processamento do prompt
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const workflow = {
        id: Date.now().toString(),
        name: generateWorkflowName(prompt),
        prompt,
        status: 'active',
        created: new Date().toISOString(),
        trigger: analyzeTrigger(prompt),
        actions: analyzeActions(prompt),
        executions: 0
      };

      onWorkflowCreate(workflow);
      setPrompt('');
      
      toast({
        title: "Automação criada!",
        description: `Workflow "${workflow.name}" foi criado com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar automação",
        description: "Tente novamente ou refine sua descrição",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generateWorkflowName = (prompt: string): string => {
    if (prompt.includes('webhook')) return 'Webhook Processing';
    if (prompt.includes('agendar') || prompt.includes('todo dia')) return 'Scheduled Task';
    if (prompt.includes('monitorar') || prompt.includes('monitor')) return 'API Monitor';
    if (prompt.includes('email')) return 'Email Automation';
    return 'Custom Workflow';
  };

  const analyzeTrigger = (prompt: string) => {
    if (prompt.includes('webhook')) return { type: 'webhook', config: {} };
    if (prompt.includes('todo dia') || prompt.includes('agendar')) return { type: 'schedule', config: { cron: '0 9 * * *' } };
    if (prompt.includes('monitorar')) return { type: 'schedule', config: { cron: '*/5 * * * *' } };
    return { type: 'manual', config: {} };
  };

  const analyzeActions = (prompt: string) => {
    const actions = [];
    if (prompt.includes('extrair') || prompt.includes('capturar')) {
      actions.push({ type: 'extract', target: 'email' });
    }
    if (prompt.includes('salvar') || prompt.includes('armazenar')) {
      actions.push({ type: 'database', operation: 'save' });
    }
    if (prompt.includes('enviar') || prompt.includes('notificar')) {
      actions.push({ type: 'notification', method: 'email' });
    }
    if (prompt.includes('relatório') || prompt.includes('report')) {
      actions.push({ type: 'report', format: 'csv' });
    }
    return actions.length > 0 ? actions : [{ type: 'process', operation: 'generic' }];
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="p-3 rounded-xl weaver-gradient">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Weaver
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Crie automações poderosas usando linguagem natural. Descreva o que você quer automatizar e deixe a IA criar o fluxo para você.
        </p>
      </div>

      <Card className="prompt-area max-w-4xl mx-auto">
        <div className="space-y-4">
          <label htmlFor="prompt" className="text-sm font-medium">
            💬 Descreva sua automação:
          </label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Quando receber um webhook com dados de formulário, extrair o email usando regex, validar o formato, e se válido, salvar no banco de dados..."
            className="min-h-[120px] text-base resize-none"
            disabled={isProcessing}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={isProcessing || !prompt.trim()}
              className="weaver-gradient text-white hover:opacity-90 transition-opacity px-8"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Criar Automação
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4">💡 Exemplos de Automações:</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {examplePrompts.map((example, index) => (
            <Card 
              key={index}
              className="automation-card cursor-pointer hover:border-primary/40 transition-all duration-200"
              onClick={() => setPrompt(example.text)}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <example.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {example.category}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {example.text}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}