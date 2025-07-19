import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Type, 
  Database, 
  Hash, 
  ArrowRight, 
  Download,
  Upload,
  Zap,
  Copy,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Operation {
  id: string;
  name: string;
  type: string;
  icon: any;
  description: string;
}

const operations: Operation[] = [
  { id: 'split', name: 'Split Text', type: 'text', icon: Type, description: 'Dividir texto por delimitador' },
  { id: 'join', name: 'Join Array', type: 'text', icon: Type, description: 'Juntar array com delimitador' },
  { id: 'regex', name: 'Regex Extract', type: 'text', icon: Code, description: 'Extrair usando regex' },
  { id: 'base64encode', name: 'Base64 Encode', type: 'encoding', icon: Hash, description: 'Codificar em Base64' },
  { id: 'base64decode', name: 'Base64 Decode', type: 'encoding', icon: Hash, description: 'Decodificar Base64' },
  { id: 'urlencode', name: 'URL Encode', type: 'encoding', icon: Hash, description: 'Codificar URL' },
  { id: 'urldecode', name: 'URL Decode', type: 'encoding', icon: Hash, description: 'Decodificar URL' },
  { id: 'jsonparse', name: 'JSON Parse', type: 'data', icon: Database, description: 'Converter JSON string para objeto' },
  { id: 'jsonstringify', name: 'JSON Stringify', type: 'data', icon: Database, description: 'Converter objeto para JSON string' },
  { id: 'uppercase', name: 'Uppercase', type: 'text', icon: Type, description: 'Converter para maiúsculas' },
  { id: 'lowercase', name: 'Lowercase', type: 'text', icon: Type, description: 'Converter para minúsculas' },
  { id: 'trim', name: 'Trim', type: 'text', icon: Type, description: 'Remover espaços das bordas' },
  { id: 'md5', name: 'MD5 Hash', type: 'hash', icon: Hash, description: 'Gerar hash MD5' },
  { id: 'sha256', name: 'SHA256 Hash', type: 'hash', icon: Hash, description: 'Gerar hash SHA256' },
];

export function DataProcessor() {
  const [inputData, setInputData] = useState('');
  const [outputData, setOutputData] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [operationParams, setOperationParams] = useState<Record<string, string>>({});
  const [pipeline, setPipeline] = useState<Array<{ operation: string; params: Record<string, string> }>>([]);
  const { toast } = useToast();

  const getOperationsByType = (type: string) => {
    return operations.filter(op => op.type === type);
  };

  const executeOperation = (operationId: string, data: string, params: Record<string, string> = {}): string => {
    try {
      switch (operationId) {
        case 'split':
          return JSON.stringify(data.split(params.delimiter || ','));
        
        case 'join':
          const array = JSON.parse(data);
          return Array.isArray(array) ? array.join(params.delimiter || ',') : data;
        
        case 'regex':
          const regex = new RegExp(params.pattern || '.*', params.flags || 'g');
          const matches = data.match(regex);
          return JSON.stringify(matches || []);
        
        case 'base64encode':
          return btoa(data);
        
        case 'base64decode':
          return atob(data);
        
        case 'urlencode':
          return encodeURIComponent(data);
        
        case 'urldecode':
          return decodeURIComponent(data);
        
        case 'jsonparse':
          return JSON.stringify(JSON.parse(data), null, 2);
        
        case 'jsonstringify':
          return JSON.stringify(data);
        
        case 'uppercase':
          return data.toUpperCase();
        
        case 'lowercase':
          return data.toLowerCase();
        
        case 'trim':
          return data.trim();
        
        case 'md5':
          // Simulação de MD5 (em produção usar crypto library)
          return btoa(data).substring(0, 32);
        
        case 'sha256':
          // Simulação de SHA256 (em produção usar crypto library)
          return btoa(data + 'sha256').substring(0, 64);
        
        default:
          return data;
      }
    } catch (error) {
      throw new Error(`Erro na operação ${operationId}: ${error}`);
    }
  };

  const applyOperation = () => {
    if (!selectedOperation || !inputData) {
      toast({
        title: "Dados incompletos",
        description: "Selecione uma operação e forneça dados de entrada",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = executeOperation(selectedOperation, inputData, operationParams);
      setOutputData(result);
      
      // Adicionar ao pipeline
      const operation = operations.find(op => op.id === selectedOperation);
      if (operation) {
        setPipeline(prev => [...prev, { 
          operation: selectedOperation, 
          params: { ...operationParams } 
        }]);
      }
      
      toast({
        title: "Operação aplicada",
        description: `${operation?.name} executada com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro na operação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const copyToInput = () => {
    setInputData(outputData);
    setOutputData('');
  };

  const clearPipeline = () => {
    setPipeline([]);
    setInputData('');
    setOutputData('');
    setOperationParams({});
  };

  const getOperationParams = (operationId: string) => {
    switch (operationId) {
      case 'split':
      case 'join':
        return [{ name: 'delimiter', label: 'Delimitador', placeholder: ',' }];
      case 'regex':
        return [
          { name: 'pattern', label: 'Padrão Regex', placeholder: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
          { name: 'flags', label: 'Flags', placeholder: 'g' }
        ];
      default:
        return [];
    }
  };

  const selectedOp = operations.find(op => op.id === selectedOperation);
  const params = selectedOp ? getOperationParams(selectedOp.id) : [];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Code className="h-8 w-8 text-primary" />
          Processador de Dados
        </h2>
        <p className="text-muted-foreground">
          Transforme e processe dados usando operações inspiradas no CyberChef
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <Label className="text-lg font-medium">Entrada</Label>
          </div>
          <Textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Cole seus dados aqui..."
            className="min-h-[200px] font-mono text-sm"
          />
        </Card>

        {/* Output Section */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <Label className="text-lg font-medium">Saída</Label>
            </div>
            {outputData && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToInput}
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Usar como entrada
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(outputData)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <Textarea
            value={outputData}
            readOnly
            placeholder="O resultado aparecerá aqui..."
            className="min-h-[200px] font-mono text-sm bg-muted/50"
          />
        </Card>
      </div>

      {/* Operations Panel */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Operações Disponíveis</h3>
          {pipeline.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearPipeline}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Limpar Pipeline
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {['text', 'encoding', 'data', 'hash'].map(type => (
            <div key={type} className="space-y-2">
              <h4 className="font-medium text-sm capitalize flex items-center gap-1">
                {type === 'text' && <Type className="h-4 w-4" />}
                {type === 'encoding' && <Hash className="h-4 w-4" />}
                {type === 'data' && <Database className="h-4 w-4" />}
                {type === 'hash' && <Hash className="h-4 w-4" />}
                {type === 'text' ? 'Texto' : 
                 type === 'encoding' ? 'Codificação' :
                 type === 'data' ? 'Dados' : 'Hash'}
              </h4>
              <div className="space-y-1">
                {getOperationsByType(type).map(op => (
                  <Button
                    key={op.id}
                    variant={selectedOperation === op.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedOperation(op.id)}
                    className="w-full justify-start text-xs"
                  >
                    <op.icon className="h-3 w-3 mr-2" />
                    {op.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Operation Parameters */}
        {selectedOp && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <selectedOp.icon className="h-5 w-5 text-primary" />
              <h4 className="font-medium">{selectedOp.name}</h4>
              <span className="text-sm text-muted-foreground">
                - {selectedOp.description}
              </span>
            </div>

            {params.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {params.map(param => (
                  <div key={param.name} className="space-y-1">
                    <Label htmlFor={param.name} className="text-sm">
                      {param.label}
                    </Label>
                    <Input
                      id={param.name}
                      placeholder={param.placeholder}
                      value={operationParams[param.name] || ''}
                      onChange={(e) => setOperationParams(prev => ({
                        ...prev,
                        [param.name]: e.target.value
                      }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button onClick={applyOperation} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Aplicar Operação
            </Button>
          </div>
        )}

        {/* Pipeline Visualization */}
        {pipeline.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Pipeline de Transformações:</h4>
            <div className="flex flex-wrap items-center gap-2">
              {pipeline.map((step, index) => {
                const op = operations.find(o => o.id === step.operation);
                return (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                    <Badge variant="outline" className="flex items-center gap-1">
                      {op && <op.icon className="h-3 w-3" />}
                      {op?.name}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}