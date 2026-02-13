import { Link } from "react-router-dom";
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  Globe, 
  Star,
  ArrowRight,
  ExternalLink,
  Trophy,
  Zap,
  Heart
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Badge from "@/components/Badge";
import { Button } from "@/components/ui/button";

const communityMembers = [
  {
    id: 1,
    name: "Membro Destaque",
    role: "Designer IA",
    avatar: "AC",
    specialty: "Midjourney",
    projects: 0,
    followers: 0,
  },
  {
    id: 2,
    name: "Membro Ativo",
    role: "Desenvolvedor",
    avatar: "PS",
    specialty: "ChatGPT",
    projects: 0,
    followers: 0,
  },
  {
    id: 3,
    name: "Membro Premium",
    role: "Marketing IA",
    avatar: "MS",
    specialty: "Copy com IA",
    projects: 0,
    followers: 0,
  },
  {
    id: 4,
    name: "Membro VIP",
    role: "Video Creator",
    avatar: "LO",
    specialty: "Runway",
    projects: 0,
    followers: 0,
  },
  {
    id: 5,
    name: "Membro Gold",
    role: "Educator",
    avatar: "JP",
    specialty: "Automação",
    projects: 0,
    followers: 0,
  },
  {
    id: 6,
    name: "Membro Silver",
    role: "Consultor",
    avatar: "RM",
    specialty: "Claude",
    projects: 0,
    followers: 0,
  },
];

const communityStats = [
  { label: "Membros Ativos", value: "Comunidade", icon: Users },
  { label: "Discussões", value: "Ativa", icon: MessageSquare },
  { label: "Projetos Compartilhados", value: "Nucleo", icon: Zap },
  { label: "Conexões", value: "IA", icon: Heart },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Masterclass: Vídeos com IA",
    date: "15 Mar, 19h",
    host: "Membro Ativo",
    attendees: 0,
  },
  {
    id: 2,
    title: "Workshop: Prompts Avançados",
    date: "18 Mar, 20h",
    host: "Membro Destaque",
    attendees: 0,
  },
  {
    id: 3,
    title: "Live: Q&A com Especialistas",
    date: "22 Mar, 18h",
    host: "Equipe Núcleo",
    attendees: 0,
  },
];

const topContributors = [
  { name: "Membro Destaque", points: 0, position: 1 },
  { name: "Membro Ativo", points: 0, position: 2 },
  { name: "Membro Premium", points: 0, position: 3 },
];

const Networking = () => {
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
          </div>
          <Badge variant="success">Comunidade</Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Grupo de Networking</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Conecte-se com outros membros, compartilhe experiências e cresça junto com a comunidade
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {communityStats.map((stat) => (
          <GlassCard key={stat.label} className="text-center py-3 sm:py-4">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
              <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Featured Members */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Membros em Destaque</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todos <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {communityMembers.map((member) => (
                <GlassCard key={member.id} hover className="flex items-center gap-3 sm:gap-4">
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm sm:text-lg font-bold text-foreground shrink-0">
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground">{member.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{member.role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="count" className="text-[10px] sm:text-xs">{member.specialty}</Badge>
                      <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline">{member.followers} seguidores</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="touch-target shrink-0">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Community Links */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Acesse a Comunidade</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <GlassCard gradient hover className="cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-[#5865F2]/20 flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 text-[#5865F2]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Discord</h3>
                    <p className="text-sm text-muted-foreground">Chat em tempo real</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
              </GlassCard>
              
              <GlassCard gradient hover className="cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-[#25D366]/20 flex items-center justify-center">
                    <Globe className="h-7 w-7 text-[#25D366]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">Grupo exclusivo</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
              </GlassCard>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <GlassCard>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Próximos Eventos
            </h3>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-3 bg-muted/50 rounded-xl">
                  <h4 className="font-medium text-foreground text-sm">{event.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{event.date} • {event.host}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{event.attendees} confirmados</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                      Participar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Leaderboard */}
          <GlassCard gradient>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Top Contribuidores
            </h3>
            <div className="space-y-3">
              {topContributors.map((contributor) => (
                <div key={contributor.position} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    contributor.position === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                    contributor.position === 2 ? 'bg-gray-400/20 text-gray-400' :
                    'bg-orange-500/20 text-orange-500'
                  }`}>
                    {contributor.position}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{contributor.name}</p>
                    <p className="text-xs text-muted-foreground">{contributor.points} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* CTA */}
          <GlassCard className="text-center py-6">
            <Zap className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Seja mais ativo!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Participe das discussões e ganhe pontos para subir no ranking.
            </p>
            <Button variant="gradient" className="w-full">
              Ver Missões
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Networking;