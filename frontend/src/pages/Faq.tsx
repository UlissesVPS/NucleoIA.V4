import { useState } from "react";
import { HelpCircle, ChevronDown, Search, MessageCircle, Book, Video, Mail } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import { Button } from "@/components/ui/button";
import InputWithIcon from "@/components/InputWithIcon";
import { cn } from "@/lib/utils";

const faqCategories = [
  { id: "all", label: "Todas" },
  { id: "account", label: "Conta" },
  { id: "ias", label: "IAs" },
  { id: "prompts", label: "Prompts" },
  { id: "courses", label: "Cursos" },
  { id: "billing", label: "Pagamentos" },
];

const faqs = [
  {
    id: 1,
    question: "Como faço para acessar as ferramentas de IA?",
    answer: "Para acessar as ferramentas de IA, vá até a seção 'Lista de IA's' no menu lateral. Lá você encontrará todas as 19+ ferramentas disponíveis no seu plano. Clique na ferramenta desejada e siga as instruções para começar a usar.",
    category: "ias",
  },
  {
    id: 2,
    question: "Como funciona o Autenticador 2FA?",
    answer: "O Autenticador 2FA gera códigos de segurança sincronizados com o Dicloak. Para usar, acesse a página do Autenticador no menu lateral, clique em 'Iniciar Gerador' e copie o código gerado. Cada código é válido por 30 segundos.",
    category: "account",
  },
  {
    id: 3,
    question: "Posso criar meus próprios prompts?",
    answer: "Sim! Na seção de Prompts, você pode criar seus próprios prompts personalizados. Clique no botão 'Novo Prompt', preencha o título, descrição e o conteúdo do prompt. Seus prompts ficarão salvos na aba 'Meus Prompts'.",
    category: "prompts",
  },
  {
    id: 4,
    question: "Como faço para acessar os cursos?",
    answer: "Os cursos estão disponíveis na seção 'Aulas' do menu lateral. Navegue pelos cursos disponíveis, clique no que deseja assistir e comece seu aprendizado. Seu progresso é salvo automaticamente.",
    category: "courses",
  },
  {
    id: 5,
    question: "Qual a diferença entre os planos?",
    answer: "O plano Premium oferece acesso ilimitado a todas as IAs, cursos, prompts e recursos da plataforma. O plano básico tem limitações de uso. Você pode ver os detalhes do seu plano atual na página de Perfil.",
    category: "billing",
  },
  {
    id: 6,
    question: "Como cancelo minha assinatura?",
    answer: "Para cancelar sua assinatura, acesse seu Perfil > Gerenciar Assinatura. Lá você encontrará a opção de cancelamento. Lembre-se que você manterá acesso até o final do período já pago.",
    category: "billing",
  },
  {
    id: 7,
    question: "Os prompts são atualizados?",
    answer: "Sim! Nossa biblioteca de prompts é constantemente atualizada com novos prompts toda semana. Você receberá notificações quando novos prompts forem adicionados às suas categorias favoritas.",
    category: "prompts",
  },
  {
    id: 8,
    question: "Como funciona o acesso Dicloak?",
    answer: "O Dicloak é uma ferramenta de acesso compartilhado. Para usar, vá até a seção 'Acesso Dicloak' no menu, gere suas credenciais e use-as para acessar a conta membro. As credenciais são atualizadas automaticamente.",
    category: "account",
  },
  {
    id: 9,
    question: "Posso assistir aos cursos offline?",
    answer: "Atualmente os cursos estão disponíveis apenas online para garantir que você sempre tenha acesso à versão mais atualizada do conteúdo.",
    category: "courses",
  },
  {
    id: 10,
    question: "Como reporto um problema?",
    answer: "Se encontrar algum problema, clique no botão 'Falar com Suporte' nesta página ou acesse o menu de ajuda. Nossa equipe responde em até 24 horas úteis.",
    category: "account",
  },
];

const helpResources = [
  { icon: Book, title: "Documentação", description: "Guias completos de uso" },
  { icon: Video, title: "Tutoriais", description: "Vídeos explicativos" },
  { icon: MessageCircle, title: "Chat", description: "Suporte ao vivo" },
  { icon: Mail, title: "E-mail", description: "suporte@nucleoia.com" },
];

const Faq = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <Badge>Suporte</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Dúvidas Frequentes</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Encontre respostas para as perguntas mais comuns sobre a plataforma
        </p>
      </div>

      {/* Search */}
      <InputWithIcon
        icon={Search}
        placeholder="Buscar perguntas..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full sm:max-w-md"
      />

      {/* Categories */}
      <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
        <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
        {faqCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap touch-target",
              activeCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {category.label}
          </button>
        ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => (
          <GlassCard 
            key={faq.id} 
            className="cursor-pointer"
            onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground pr-4">{faq.question}</h3>
              <ChevronDown 
                className={cn(
                  "h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200",
                  openFaq === faq.id && "rotate-180"
                )}
              />
            </div>
            <div 
              className={cn(
                "overflow-hidden transition-all duration-200",
                openFaq === faq.id ? "max-h-96 mt-4" : "max-h-0"
              )}
            >
              <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredFaqs.length === 0 && (
        <GlassCard className="text-center py-12">
          <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma pergunta encontrada</h3>
          <p className="text-muted-foreground">Tente buscar por outros termos ou categorias</p>
        </GlassCard>
      )}

      {/* Help Resources */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Outros Recursos de Ajuda</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {helpResources.map((resource) => (
            <GlassCard key={resource.title} hover className="text-center py-6 cursor-pointer">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <resource.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium text-foreground">{resource.title}</h4>
              <p className="text-sm text-muted-foreground">{resource.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <GlassCard gradient className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Não encontrou o que procura?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Nossa equipe está pronta para ajudar você.</p>
          </div>
          <Button variant="gradient" className="w-full sm:w-auto">
            <MessageCircle className="h-4 w-4 mr-2" />
            Falar com Suporte
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Faq;