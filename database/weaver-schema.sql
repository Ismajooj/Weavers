-- =====================================================
-- Weaver Platform - Complete Database Schema
-- PostgreSQL Schema for Self-Hosted Automation Platform
-- =====================================================

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption functions if needed

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

COMMENT ON TABLE users IS 'Armazena informações dos usuários da plataforma Weaver';
COMMENT ON COLUMN users.email IS 'Email único para login e identificação';
COMMENT ON COLUMN users.hashed_password IS 'Senha hasheada usando bcrypt ou algoritmo similar';
COMMENT ON COLUMN users.is_active IS 'Flag para desativar usuários sem deletar dados';

-- =====================================================
-- CREDENTIALS TABLE  
-- =====================================================
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'API_KEY', 'OAUTH2', 'BEARER_TOKEN', 'BASIC_AUTH', 'CUSTOM'
    encrypted_value BYTEA NOT NULL,
    metadata JSONB DEFAULT '{}', -- Armazena configurações extras como endpoints, scopes, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, name)
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_type ON credentials(type);
CREATE INDEX idx_credentials_active ON credentials(is_active);

COMMENT ON TABLE credentials IS 'Armazena credenciais sensíveis de forma segura com criptografia';
COMMENT ON COLUMN credentials.encrypted_value IS 'Valor da credencial criptografado na camada de aplicação';
COMMENT ON COLUMN credentials.metadata IS 'Configurações adicionais específicas do tipo de credencial';

-- =====================================================
-- WORKFLOWS TABLE
-- =====================================================
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'archived', 'error'
    version INTEGER DEFAULT 1,
    trigger_config JSONB NOT NULL DEFAULT '{}', -- Configuração do trigger (webhook, schedule, manual, etc.)
    error_handling JSONB DEFAULT '{}', -- Configurações de retry, timeout, fallback
    tags TEXT[], -- Tags para organização e busca
    is_public BOOLEAN DEFAULT false, -- Para compartilhamento futuro
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_executed TIMESTAMP WITH TIME ZONE,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);
CREATE INDEX idx_workflows_updated_at ON workflows(updated_at DESC);

COMMENT ON TABLE workflows IS 'Armazena definições completas de workflows de automação';
COMMENT ON COLUMN workflows.trigger_config IS 'Configuração JSON do trigger (tipo, parâmetros, condições)';
COMMENT ON COLUMN workflows.error_handling IS 'Políticas de tratamento de erro e retry';
COMMENT ON COLUMN workflows.tags IS 'Array de tags para categorização e busca';

-- =====================================================
-- WORKFLOW_STEPS TABLE
-- =====================================================
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    operation_type VARCHAR(100) NOT NULL, -- 'http_request', 'data_transform', 'condition', 'loop', etc.
    operation_params JSONB NOT NULL DEFAULT '{}', -- Parâmetros específicos da operação
    credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL, -- Credencial opcional
    error_handling JSONB DEFAULT '{}', -- Tratamento de erro específico do step
    timeout_seconds INTEGER DEFAULT 30,
    retry_count INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, step_order)
);

CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_order ON workflow_steps(workflow_id, step_order);
CREATE INDEX idx_workflow_steps_operation_type ON workflow_steps(operation_type);

COMMENT ON TABLE workflow_steps IS 'Define os passos individuais de cada workflow em ordem';
COMMENT ON COLUMN workflow_steps.operation_params IS 'Parâmetros JSON específicos para cada tipo de operação';
COMMENT ON COLUMN workflow_steps.step_order IS 'Ordem de execução dentro do workflow';

-- =====================================================
-- USER_PROMPTS TABLE
-- =====================================================
CREATE TABLE user_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    ai_interpretation JSONB, -- Resultado da interpretação da IA
    created_workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL, -- Workflow criado a partir do prompt
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'error', 'manual_review'
    processing_time_ms INTEGER,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_prompts_user_id ON user_prompts(user_id);
CREATE INDEX idx_user_prompts_status ON user_prompts(status);
CREATE INDEX idx_user_prompts_created_at ON user_prompts(created_at DESC);
CREATE INDEX idx_user_prompts_workflow_id ON user_prompts(created_workflow_id);

COMMENT ON TABLE user_prompts IS 'Histórico de prompts dos usuários e interpretações da IA';
COMMENT ON COLUMN user_prompts.ai_interpretation IS 'Resultado estruturado da interpretação do prompt pela IA';
COMMENT ON COLUMN user_prompts.feedback_rating IS 'Avaliação do usuário sobre a qualidade da interpretação (1-5)';

-- =====================================================
-- EXECUTIONS TABLE
-- =====================================================
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_source VARCHAR(50) NOT NULL, -- 'manual', 'webhook', 'schedule', 'api'
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled', 'timeout'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    trigger_data JSONB DEFAULT '{}', -- Dados que iniciaram a execução
    final_output JSONB DEFAULT '{}', -- Resultado final da execução
    error_message TEXT,
    error_stack TEXT, -- Stack trace para debugging
    steps_completed INTEGER DEFAULT 0,
    steps_total INTEGER DEFAULT 0,
    memory_usage_mb DECIMAL(8,2),
    cpu_time_ms INTEGER
);

CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started_at ON executions(started_at DESC);
CREATE INDEX idx_executions_trigger_source ON executions(trigger_source);
CREATE INDEX idx_executions_duration ON executions(duration_ms);

COMMENT ON TABLE executions IS 'Registro de todas as execuções de workflows com métricas de performance';
COMMENT ON COLUMN executions.trigger_source IS 'Origem que disparou a execução';
COMMENT ON COLUMN executions.duration_ms IS 'Tempo total de execução em milissegundos';

-- =====================================================
-- EXECUTION_LOGS TABLE
-- =====================================================
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
    step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
    step_order INTEGER NOT NULL,
    log_level VARCHAR(10) DEFAULT 'INFO', -- 'DEBUG', 'INFO', 'WARN', 'ERROR'
    status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed', 'skipped'
    step_input JSONB DEFAULT '{}',
    step_output JSONB DEFAULT '{}',
    error_message TEXT,
    error_code VARCHAR(50),
    duration_ms INTEGER,
    memory_usage_mb DECIMAL(8,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}' -- Informações extras de debugging
);

CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_step_order ON execution_logs(execution_id, step_order);
CREATE INDEX idx_execution_logs_status ON execution_logs(status);
CREATE INDEX idx_execution_logs_level ON execution_logs(log_level);
CREATE INDEX idx_execution_logs_timestamp ON execution_logs(timestamp DESC);

COMMENT ON TABLE execution_logs IS 'Logs detalhados de cada passo de cada execução';
COMMENT ON COLUMN execution_logs.log_level IS 'Nível de severidade do log';
COMMENT ON COLUMN execution_logs.metadata IS 'Dados extras para debugging e análise';

-- =====================================================
-- WORKFLOW_TEMPLATES TABLE (Para funcionalidade futura)
-- =====================================================
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'data_processing', 'api_integration', 'notifications', etc.
    template_data JSONB NOT NULL, -- Estrutura completa do workflow template
    example_prompts TEXT[], -- Exemplos de prompts que gerariam este template
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX idx_workflow_templates_usage ON workflow_templates(usage_count DESC);

COMMENT ON TABLE workflow_templates IS 'Templates de workflows para reutilização e sugestões';

-- =====================================================
-- WEBHOOK_ENDPOINTS TABLE
-- =====================================================
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    endpoint_url VARCHAR(255) UNIQUE NOT NULL, -- URL única para receber webhooks
    secret_token VARCHAR(255), -- Token para validação de origem
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_endpoints_workflow_id ON webhook_endpoints(workflow_id);
CREATE INDEX idx_webhook_endpoints_url ON webhook_endpoints(endpoint_url);
CREATE INDEX idx_webhook_endpoints_active ON webhook_endpoints(is_active);

COMMENT ON TABLE webhook_endpoints IS 'Endpoints únicos para receber webhooks por workflow';

-- =====================================================
-- SCHEDULED_JOBS TABLE
-- =====================================================
CREATE TABLE scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    cron_expression VARCHAR(100) NOT NULL, -- Expressão cron para agendamento
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    next_run TIMESTAMP WITH TIME ZONE,
    last_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_jobs_workflow_id ON scheduled_jobs(workflow_id);
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run);
CREATE INDEX idx_scheduled_jobs_active ON scheduled_jobs(is_active);

COMMENT ON TABLE scheduled_jobs IS 'Agendamentos de execução automática de workflows';

-- =====================================================
-- TRIGGERS (Para manter timestamps atualizados)
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em tabelas relevantes
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para estatísticas de workflow
CREATE VIEW workflow_stats AS
SELECT 
    w.id,
    w.name,
    w.status,
    w.execution_count,
    w.success_count,
    w.error_count,
    CASE 
        WHEN w.execution_count > 0 THEN (w.success_count::DECIMAL / w.execution_count * 100)
        ELSE 0 
    END as success_rate,
    w.last_executed,
    COUNT(ws.id) as step_count
FROM workflows w
LEFT JOIN workflow_steps ws ON w.id = ws.workflow_id
GROUP BY w.id, w.name, w.status, w.execution_count, w.success_count, w.error_count, w.last_executed;

-- View para execuções recentes com detalhes
CREATE VIEW recent_executions AS
SELECT 
    e.id,
    e.workflow_id,
    w.name as workflow_name,
    w.user_id,
    u.email as user_email,
    e.status,
    e.trigger_source,
    e.started_at,
    e.finished_at,
    e.duration_ms,
    e.steps_completed,
    e.steps_total
FROM executions e
JOIN workflows w ON e.workflow_id = w.id
JOIN users u ON w.user_id = u.id
ORDER BY e.started_at DESC;

-- =====================================================
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir tipos de operação padrão para referência
-- Isso pode ser usado pela aplicação para validação e UI
INSERT INTO workflow_templates (name, description, category, template_data, example_prompts) VALUES
('HTTP Request', 'Fazer requisição HTTP para API externa', 'api_integration', 
 '{"steps": [{"operation_type": "http_request", "operation_params": {"method": "GET", "url": "", "headers": {}}}]}',
 ARRAY['fazer requisição GET para API', 'buscar dados de URL externa']
),
('Data Transform', 'Transformar e processar dados JSON', 'data_processing',
 '{"steps": [{"operation_type": "data_transform", "operation_params": {"operations": []}}]}',
 ARRAY['transformar dados JSON', 'processar dados recebidos', 'converter formato']
),
('Send Email', 'Enviar email via SMTP', 'notifications',
 '{"steps": [{"operation_type": "send_email", "operation_params": {"to": "", "subject": "", "body": ""}}]}',
 ARRAY['enviar email', 'notificar por email', 'mandar mensagem email']
);

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

/*
Este schema foi projetado para ser:

1. ESCALÁVEL: Suporta milhões de execuções com índices otimizados
2. FLEXÍVEL: Usa JSONB para dados semi-estruturados
3. SEGURO: Credenciais criptografadas e isoladas
4. AUDITÁVEL: Logs completos de todas as operações
5. EXTENSÍVEL: Fácil adicionar novos tipos de operação
6. PERFORMÁTICO: Índices estratégicos para consultas frequentes

Próximos passos para implementação:
- Configurar pooling de conexões
- Implementar lógica de criptografia para credenciais
- Criar APIs REST para cada entidade
- Implementar sistema de jobs para execuções
- Adicionar monitoramento e alertas
*/