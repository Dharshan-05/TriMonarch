import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { Tooltip } from '@/components/ui/tooltip';
import { Tabs } from '@/components/ui/tabs';
import { SearchInput, FilterBar, FilterChip } from '@/components/ui/search-and-filter';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils/formatters';
import {
  Layers,
  Palette,
  CheckCircle2,
  AlertTriangle,
  Info,
  Package,
  Plus,
  Trash2,
  Edit,
  Eye,
  Loader2,
} from 'lucide-react';

export const ShowcasePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('components');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([
    { label: 'Category', value: 'Hardware' },
    { label: 'Status', value: 'Active' },
  ]);

  const breadcrumbs = [
    { label: 'System', href: '/' },
    { label: 'Design System Showcase' },
  ];

  const sampleData = [
    {
      id: 'PRD-001',
      name: 'Precision Milling Spindle',
      category: 'Machinery',
      sku: 'SKU-9921',
      qty: 124,
      price: 1450.0,
      status: 'active' as const,
      updatedAt: '2026-08-20T10:30:00Z',
    },
    {
      id: 'PRD-002',
      name: 'Industrial Servo Drive',
      category: 'Electronics',
      sku: 'SKU-4412',
      qty: 18,
      price: 620.5,
      status: 'low_stock' as const,
      updatedAt: '2026-08-19T14:15:00Z',
    },
    {
      id: 'PRD-003',
      name: 'Pneumatic Control Valve',
      category: 'Hydraulics',
      sku: 'SKU-1029',
      qty: 0,
      price: 210.0,
      status: 'out_of_stock' as const,
      updatedAt: '2026-08-18T09:00:00Z',
    },
    {
      id: 'PRD-004',
      name: 'CNC Carbide Cutter Assembly',
      category: 'Tooling',
      sku: 'SKU-8831',
      qty: 450,
      price: 85.0,
      status: 'approved' as const,
      updatedAt: '2026-08-17T16:45:00Z',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Enterprise Design System Showcase"
        description="Comprehensive visual and functional specification for the Mini ERP component system."
        breadcrumbs={breadcrumbs}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              Test Modal Dialog
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Primary Action
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'components', label: 'UI Components', icon: <Layers className="h-4 w-4" /> },
          { id: 'tokens', label: 'Design Tokens & Theme', icon: <Palette className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'components' && (
        <div className="space-y-8">
          {/* Section: Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Typography System</CardTitle>
              <CardDescription>
                Standardized type scale with support for tabular numerical alignment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground font-mono">Display Title (3xl bold)</p>
                <h1 className="text-3xl font-extrabold tracking-tight">Mini ERP Enterprise Suite</h1>
              </div>
              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground font-mono">Page Title (2xl semibold)</p>
                <h2 className="text-2xl font-semibold tracking-tight">Inventory Ledger Overview</h2>
              </div>
              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground font-mono">Section Heading (lg medium)</p>
                <h3 className="text-lg font-medium">Material Consumption Analysis</h3>
              </div>
              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground font-mono">Body Text (sm regular)</p>
                <p className="text-sm text-foreground">
                  The Mini ERP design system enforces strict scanability, accessibility, and high data density across all operational modules.
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">Numeric Tabular Data (tabular-nums font-mono)</p>
                <div className="font-mono text-sm tabular-nums space-x-6">
                  <span>Balance: {formatCurrency(124850.75)}</span>
                  <span>Quantity: {formatQuantity(14500)} units</span>
                  <span>Date: {formatDate(new Date(), 'full')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Button Hierarchy & States</CardTitle>
              <CardDescription>
                Primary, secondary, outline, ghost, and destructive button primitives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Variants</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">Default Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link Style</Button>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Sizes</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small (sm)</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large (lg)</Button>
                  <Button size="icon" aria-label="Settings">
                    <Package className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">States</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button disabled>Disabled Button</Button>
                  <Button disabled variant="outline">Disabled Outline</Button>
                  <Button className="gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading State
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Form Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Form Control Primitives</CardTitle>
              <CardDescription>
                Enterprise form inputs, select dropdowns, textareas, checkboxes, and switches.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField label="Standard Text Input" required description="Enter item name or code">
                <Input placeholder="e.g. Servo Motor Assembly" />
              </FormField>

              <FormField label="Input with Validation Error" required error="SKU code must be unique and non-empty">
                <Input value="SKU-ERR-99" error />
              </FormField>

              <FormField label="Category Select Dropdown" required>
                <Select defaultValue="machinery">
                  <option value="machinery">Machinery & Equipment</option>
                  <option value="electronics">Electronics & Components</option>
                  <option value="hydraulics">Hydraulic Systems</option>
                </Select>
              </FormField>

              <FormField label="Disabled Control">
                <Input value="READ-ONLY-SYSTEM-VAL" disabled />
              </FormField>

              <FormField label="Description Textarea" className="md:col-span-2">
                <Textarea placeholder="Enter detailed operational notes..." rows={3} />
              </FormField>

              <div className="flex items-center gap-6 md:col-span-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="chk1" checked={checkboxChecked} onCheckedChange={setCheckboxChecked} />
                  <label htmlFor="chk1" className="text-sm font-medium leading-none cursor-pointer">
                    Enable Automatic Reorder
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="sw1" checked={switchChecked} onCheckedChange={setSwitchChecked} />
                  <label htmlFor="sw1" className="text-sm font-medium leading-none cursor-pointer">
                    Active Status Override
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Status Badges & Data Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Status System & Data Table</CardTitle>
              <CardDescription>
                Semantic business status badges and structured data table primitives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Badges showcase */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Status Badges</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="active">Active</Badge>
                  <Badge variant="pending">Pending</Badge>
                  <Badge variant="approved">Approved</Badge>
                  <Badge variant="draft">Draft</Badge>
                  <Badge variant="processing">Processing</Badge>
                  <Badge variant="completed">Completed</Badge>
                  <Badge variant="cancelled">Cancelled</Badge>
                  <Badge variant="low_stock">Low Stock</Badge>
                  <Badge variant="out_of_stock">Out of Stock</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <FilterBar
                activeFiltersCount={activeFilters.length}
                onClearFilters={() => setActiveFilters([])}
              >
                <SearchInput
                  value={searchQuery}
                  onSearchChange={setSearchQuery}
                  placeholder="Search products by SKU or name..."
                />
                {activeFilters.map((f, i) => (
                  <FilterChip
                    key={i}
                    label={f.label}
                    value={f.value}
                    onRemove={() =>
                      setActiveFilters((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  />
                ))}
              </FilterBar>

              {/* Data Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code / ID</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs font-semibold">{row.id}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatQuantity(row.qty)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-semibold">
                        {formatCurrency(row.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status}>{row.status.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(row.updatedAt, 'short')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip content="View Details">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Edit Record">
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Delete Record">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Section: Feedback & Skeletons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback & Loading States</CardTitle>
              <CardDescription>
                Alert banners, generic empty states, and skeleton loading primitives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Alert variant="info">
                  <Info className="h-4 w-4" />
                  <AlertTitle>System Information</AlertTitle>
                  <AlertDescription>
                    All design system tokens conform to WCAG 2.1 AA accessibility standards.
                  </AlertDescription>
                </Alert>

                <Alert variant="success">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Operation Successful</AlertTitle>
                  <AlertDescription>
                    Product pricing rules updated cleanly across all warehouses.
                  </AlertDescription>
                </Alert>

                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Low Stock Threshold Warning</AlertTitle>
                  <AlertDescription>
                    3 items in warehouse A-12 have reached minimum stock levels.
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Authorization Error</AlertTitle>
                  <AlertDescription>
                    You do not have permission to execute batch inventory write-offs.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Skeleton Loaders */}
              <div className="border rounded-lg p-4 space-y-3 bg-card">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Skeleton Loader Preview</p>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>

              {/* Loading & Error States */}
              <div className="grid gap-4 md:grid-cols-2">
                <LoadingState message="Simulating asynchronous data query..." />
                <ErrorState
                  title="Query Connection Error"
                  message="Failed to retrieve inventory ledger snapshot from server."
                  onRetry={() => alert('Retrying request...')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'tokens' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Design System Token Architecture</CardTitle>
            <CardDescription>
              Centralized CSS variable tokens mapped in tailwind.config.js and globals.css.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Semantic Color Swatches</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border p-3 bg-background">
                  <div className="h-8 rounded bg-primary mb-2" />
                  <p className="text-xs font-semibold">Primary Token</p>
                  <p className="text-[10px] text-muted-foreground">hsl(var(--primary))</p>
                </div>
                <div className="rounded-md border p-3 bg-background">
                  <div className="h-8 rounded bg-secondary mb-2" />
                  <p className="text-xs font-semibold">Secondary Token</p>
                  <p className="text-[10px] text-muted-foreground">hsl(var(--secondary))</p>
                </div>
                <div className="rounded-md border p-3 bg-background">
                  <div className="h-8 rounded bg-success mb-2" />
                  <p className="text-xs font-semibold">Success Token</p>
                  <p className="text-[10px] text-muted-foreground">hsl(var(--success))</p>
                </div>
                <div className="rounded-md border p-3 bg-background">
                  <div className="h-8 rounded bg-warning mb-2" />
                  <p className="text-xs font-semibold">Warning Token</p>
                  <p className="text-[10px] text-muted-foreground">hsl(var(--warning))</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Modal Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Design System Dialog Demo"
        description="This modal dialog verifies focus containment, backdrop blur, and keyboard escape handling."
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>Confirm Action</Button>
          </>
        }
      >
        <p className="text-sm text-foreground">
          The dialog component supports custom title, description, content body, and action footer.
        </p>
      </Dialog>
    </div>
  );
};
