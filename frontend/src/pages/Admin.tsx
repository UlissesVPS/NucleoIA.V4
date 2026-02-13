import { Crown, BarChart3, Users, Activity, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab, MembersTab, OnlineUsersTab, ActivityLogsTab } from "@/components/admin/tabs";


const Admin = () => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">Painel Super Admin</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gestão completa da plataforma</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        {/* Mobile: Horizontal scroll tabs */}
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="w-max sm:w-full justify-start bg-muted/50 p-1 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 sm:gap-2 data-[state=active]:bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 touch-target">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden xs:inline text-xs sm:text-sm">Visão Geral</span>
              <span className="xs:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-1.5 sm:gap-2 data-[state=active]:bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 touch-target">
              <Users className="h-4 w-4" />
              <span className="hidden xs:inline text-xs sm:text-sm">Membros</span>
              <span className="xs:hidden">👥</span>
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center gap-1.5 sm:gap-2 data-[state=active]:bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 touch-target">
              <Activity className="h-4 w-4" />
              <span className="hidden xs:inline text-xs sm:text-sm">Online</span>
              <span className="xs:hidden">🟢</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5 sm:gap-2 data-[state=active]:bg-background px-2.5 sm:px-3 py-1.5 sm:py-2 touch-target">
              <FileText className="h-4 w-4" />
              <span className="hidden xs:inline text-xs sm:text-sm">Logs</span>
              <span className="xs:hidden">📋</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 sm:mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="members" className="mt-4 sm:mt-6">
          <MembersTab />
        </TabsContent>

        <TabsContent value="online" className="mt-4 sm:mt-6">
          <OnlineUsersTab />
        </TabsContent>

        <TabsContent value="logs" className="mt-4 sm:mt-6">
          <ActivityLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
