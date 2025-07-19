import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Code, 
  Activity, 
  Settings, 
  Moon, 
  Sun, 
  Menu,
  X 
} from 'lucide-react';

interface WeaverHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function WeaverHeader({ activeTab, onTabChange }: WeaverHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const tabs = [
    { id: 'automation', label: 'Automação', icon: Sparkles },
    { id: 'processor', label: 'Processador', icon: Code },
    { id: 'monitor', label: 'Monitor', icon: Activity },
  ];

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl weaver-gradient">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Weaver
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Automation Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'weaver-gradient text-white hover:opacity-90' 
                    : 'hover:bg-muted'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start gap-2 ${
                    activeTab === tab.id 
                      ? 'weaver-gradient text-white' 
                      : ''
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              ))}
              
              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {isDark ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />}
                  {isDark ? 'Modo Claro' : 'Modo Escuro'}
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Configurações
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}