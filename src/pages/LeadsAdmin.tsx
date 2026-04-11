import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLeads, LeadFilters, LeadRow } from '@/hooks/useLeads';
import { UserProfileModal } from '@/components/dashboard/UserProfileModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, Download, Phone, Users2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_SIZE = 25;

const RANGE_OPTIONS = [
  { label: 'All Time', value: '' },
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
] as const;

const LeadsAdmin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string | null;
    email: string | null;
  } | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Derive filters from URL
  const filters: LeadFilters = {
    hasPhone: searchParams.get('hasPhone') === 'true',
    hasReferral: searchParams.get('referral') === 'true',
    search: searchParams.get('search') || '',
    range: searchParams.get('range') || '',
    page: parseInt(searchParams.get('page') || '0', 10),
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading } = useLeads(filters);
  const leads = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!value) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        // Reset page on filter change (unless changing page itself)
        if (key !== 'page') next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const handleSearch = () => {
    updateParam('search', searchInput || null);
  };

  const handleExportCSV = () => {
    if (!leads.length) return;
    const headers = ['Name', 'Email', 'Phone', 'Source', 'Created At'];
    const rows = leads.map((l) => [
      l.name || '',
      l.email || '',
      l.user_number || '',
      l.referred_by ? 'Referral' : 'Direct',
      l.created_at ? format(new Date(l.created_at), 'yyyy-MM-dd HH:mm') : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads / Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCount} total {totalCount === 1 ? 'lead' : 'leads'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!leads.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-xl p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleSearch}>
          Search
        </Button>

        {/* Has Phone toggle */}
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Has Phone</span>
          <Switch
            checked={filters.hasPhone}
            onCheckedChange={(v) => updateParam('hasPhone', v ? 'true' : null)}
          />
        </div>

        {/* Affiliate toggle */}
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Referrals</span>
          <Switch
            checked={filters.hasReferral}
            onCheckedChange={(v) => updateParam('referral', v ? 'true' : null)}
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={(filters.range || '') === opt.value ? 'default' : 'ghost'}
              size="sm"
              className="text-xs h-8"
              onClick={() => updateParam('range', opt.value || null)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-from" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No leads match the current filters.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead: LeadRow) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedCustomer({
                      id: lead.id,
                      name: lead.name,
                      email: lead.email,
                    })
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-gradient flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
                        {(lead.name || lead.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground truncate max-w-[160px]">
                        {lead.name || 'Anonymous'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {lead.email || '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.user_number ? (
                      <span className="text-foreground">{lead.user_number}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={lead.referred_by ? 'default' : 'secondary'} className="text-xs">
                      {lead.referred_by ? 'Referral' : 'Direct'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(lead.created_at), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => updateParam('page', String(Math.max(0, filters.page - 1)))}
                className={filters.page === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const startPage = Math.max(0, Math.min(filters.page - 2, totalPages - 5));
              const pageNum = startPage + i;
              if (pageNum >= totalPages) return null;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    isActive={pageNum === filters.page}
                    onClick={() => updateParam('page', String(pageNum))}
                    className="cursor-pointer"
                  >
                    {pageNum + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => updateParam('page', String(Math.min(totalPages - 1, filters.page + 1)))}
                className={filters.page >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Profile Modal */}
      {selectedCustomer && (
        <UserProfileModal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          customerId={selectedCustomer.id}
          userName={selectedCustomer.name || 'Anonymous User'}
          userEmail={selectedCustomer.email || ''}
        />
      )}
    </div>
  );
};

export default LeadsAdmin;
