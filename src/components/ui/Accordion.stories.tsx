import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Accordion, AccordionTrigger, AccordionContent, AccordionGroup, AccordionItem } from './Accordion'
import { List, ListItem, ListItemContent, ListItemIcon, ListDivider, ListHeader, ListSection } from './List'
import { InfoCard, AlertBanner } from './InfoCard'
import { Badge } from './Badge'
import { Card, CardHeader, CardTitle } from './Card'
import { AlertTriangle, Pill, Activity, Calendar, User, CheckCircle, Ban } from 'lucide-react'

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Accordion component provides a pure, composable way to create collapsible content sections.

## Design Philosophy
- **Pure Components**: No side effects, just props in and UI out
- **Composable**: Mix and match with any content
- **Controlled/Uncontrolled**: Works both ways
- **Accessible**: Keyboard navigation and ARIA attributes

## Components
- **Accordion**: Single collapsible section
- **AccordionGroup**: Manages multiple accordions (single/multiple mode)
- **AccordionTrigger**: Clickable header
- **AccordionContent**: Collapsible content area

## Usage
\`\`\`tsx
// Simple accordion
<Accordion defaultExpanded>
  <AccordionTrigger>Title</AccordionTrigger>
  <AccordionContent>Content</AccordionContent>
</Accordion>

// With any content
<Card>
  <Accordion>
    <AccordionTrigger>
      <ListHeader icon={<Pill />} action={<Badge>2</Badge>}>
        Medications
      </ListHeader>
    </AccordionTrigger>
    <AccordionContent>
      <List>
        <ListItem>Item 1</ListItem>
        <ListItem>Item 2</ListItem>
      </List>
    </AccordionContent>
  </Accordion>
</Card>
\`\`\`
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    expanded: {
      control: 'boolean',
      description: 'Controlled expanded state',
    },
    defaultExpanded: {
      control: 'boolean',
      description: 'Default expanded state',
    },
    collapsible: {
      control: 'boolean',
      description: 'Whether the accordion can be collapsed',
    },
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'ghost'],
      description: 'Visual variant',
    },
  },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

// Interactive Playground
export const Playground: Story = {
  name: '🎮 Interactive Playground',
  args: {
    defaultExpanded: false,
    collapsible: true,
    variant: 'default',
  },
  render: (args) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [eventLog, setEventLog] = React.useState<string[]>([]);
    
    const logEvent = (event: string) => {
      setEventLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${event}`]);
      console.log(event);
    };
    
    return (
      <div className="space-y-4">
        <div className="w-[400px]">
          <Accordion 
            {...args}
            expanded={isExpanded}
            onExpandedChange={(expanded) => {
              setIsExpanded(expanded);
              logEvent(`Accordion ${expanded ? 'expanded' : 'collapsed'}`);
            }}
          >
            <AccordionTrigger>
              Interactive Accordion
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-neutral-700">
                This accordion tracks its state and logs events. Try toggling it!
              </p>
            </AccordionContent>
          </Accordion>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
          <p className="font-semibold mb-2">Event Log:</p>
          {eventLog.map((log, i) => (
            <p key={i} className="text-gray-600">{log}</p>
          ))}
        </div>
      </div>
    );
  },
};

// Basic Examples
export const Default: Story = {
  args: {
    defaultExpanded: true,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Accordion {...args} onExpandedChange={(expanded) => console.log('expandedChange:', expanded)}>
        <AccordionTrigger>Click to toggle</AccordionTrigger>
        <AccordionContent>
          <p className="text-sm text-neutral-700">
            This is a simple accordion. The content can be any React node.
          </p>
        </AccordionContent>
      </Accordion>
    </div>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [expanded, setExpanded] = React.useState(false)
    
    return (
      <div className="w-[400px] space-y-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-4 py-2 bg-willow-primary-500 text-white rounded"
        >
          Toggle from outside
        </button>
        
        <Accordion expanded={expanded} onExpandedChange={setExpanded}>
          <AccordionTrigger>Controlled Accordion</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-neutral-700">
              This accordion is controlled from outside. Try the button above!
            </p>
          </AccordionContent>
        </Accordion>
      </div>
    )
  },
}

export const AccordionGroupSingle: Story = {
  render: () => (
    <div className="w-[500px]">
      <AccordionGroup type="single" defaultValue="item-1">
        <AccordionItem value="item-1" variant="bordered">
          <AccordionTrigger>First Section</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">Only one section can be open at a time.</p>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2" variant="bordered">
          <AccordionTrigger>Second Section</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">Opening this will close the first section.</p>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3" variant="bordered">
          <AccordionTrigger>Third Section</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">This follows the same single-selection behavior.</p>
          </AccordionContent>
        </AccordionItem>
      </AccordionGroup>
    </div>
  ),
}

export const AccordionGroupMultiple: Story = {
  render: () => (
    <div className="w-[500px]">
      <AccordionGroup type="multiple" defaultValue={['item-1', 'item-3']}>
        <AccordionItem value="item-1" variant="bordered">
          <AccordionTrigger>First Section</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">Multiple sections can be open at once.</p>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2" variant="bordered">
          <AccordionTrigger>Second Section</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">This section starts closed.</p>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3" variant="bordered">
          <AccordionTrigger>Third Section</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">This section starts open along with the first.</p>
          </AccordionContent>
        </AccordionItem>
      </AccordionGroup>
    </div>
  ),
}

// Composed Examples
export const MedicationsList: Story = {
  name: 'Medications List (Figma Style)',
  render: () => (
    <div className="w-[340px]">
      <Accordion defaultExpanded variant="default">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-neutral-950" />
            <span className="text-[18px] font-medium text-neutral-950">Your Medications</span>
          </div>
          <Badge variant="soft" color="neutral" size="sm" dot>1 Item</Badge>
        </AccordionTrigger>
        <AccordionContent>
          <List variant="divided">
            <ListItem
              padding="md"
              leading={
                <ListItemIcon variant="default" size="sm">
                  <Pill className="w-4 h-4" />
                </ListItemIcon>
              }
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <ListItemContent
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px]">Acetaminophen (Tylenol)</span>
                      <Badge variant="soft" color="warning" size="sm">650mg</Badge>
                    </div>
                  }
                  description="Take 650mg every 6 hours when needed for headache; do not exceed 3000mg in 24 hours. Do not use NSAIDs like ibuprofen or aspirin."
                />
              </div>
            </ListItem>
            
            <ListItem
              padding="md"
              leading={
                <ListItemIcon variant="default" size="sm">
                  <Pill className="w-4 h-4" />
                </ListItemIcon>
              }
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <ListItemContent
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px]">Melatonin</span>
                      <Badge variant="soft" color="warning" size="sm">3mg</Badge>
                    </div>
                  }
                  description="Take 3mg 30 minutes before bedtime only if you have trouble sleeping. Use for up to 2 weeks"
                />
              </div>
            </ListItem>
          </List>
        </AccordionContent>
      </Accordion>
    </div>
  ),
}

export const ActivityRestrictions: Story = {
  name: 'Activity Restrictions (Composed)',
  render: () => (
    <div className="w-[340px]">
      <Card>
        <CardHeader color="neutral" variant="colored">
          <CardTitle>Activity Guidelines</CardTitle>
        </CardHeader>
        <Accordion defaultExpanded>
          <AccordionTrigger variant="padded">
            <ListHeader 
              icon={<Activity className="w-4 h-4" />}
              action={<Badge variant="soft" color="neutral" size="sm" dot>3 Items</Badge>}
            >
              <span className="text-[18px] font-medium">Activity</span>
            </ListHeader>
          </AccordionTrigger>
          <AccordionContent padding="none">
            <List className="p-4 space-y-3">
              <div>
                <ListItem
                  leading={<ListItemIcon variant="success"><CheckCircle className="w-4 h-4" /></ListItemIcon>}
                >
                  <ListItemContent
                    title="Rest and perform light activities"
                    description="Rest completely for the first 24-48 hours. Then slowly start light activities like short walks (10-15 minutes) and light reading."
                  />
                </ListItem>
                <InfoCard variant="warning" size="sm" className="mt-2">
                  First 48 hours full rest; Days 3-7 light activity; Week 2 gradual increase
                </InfoCard>
              </div>

              <ListDivider />

              <div>
                <ListItem
                  leading={<ListItemIcon variant="danger"><Ban className="w-4 h-4" /></ListItemIcon>}
                >
                  <ListItemContent
                    title="NO Contact sports, heavy lifting, strenuous exercise"
                    description="Avoid contact sports and heavy activities as they can make symptoms worse"
                  />
                </ListItem>
                <InfoCard variant="warning" size="sm" className="mt-2">
                  Until cleared by healthcare provider
                </InfoCard>
              </div>

              <ListDivider />

              <div>
                <ListItem
                  leading={<ListItemIcon variant="danger"><Ban className="w-4 h-4" /></ListItemIcon>}
                >
                  <ListItemContent
                    title="NO Driving, work, school"
                    description="Do not drive or go back to work/school until your doctor says it's safe"
                  />
                </ListItem>
                <InfoCard variant="warning" size="sm" className="mt-2">
                  Until cleared by healthcare provider
                </InfoCard>
              </div>
            </List>
          </AccordionContent>
        </Accordion>
      </Card>
    </div>
  ),
}

export const RedFlagsWarning: Story = {
  name: 'Red Flags Warning (Figma Style)',
  render: () => (
    <div className="w-[340px]">
      <div className="bg-white rounded-[10px] overflow-hidden border border-red-100 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <AlertBanner variant="danger" size="sm">
          Call 911 If you are experiencing any of these symptoms
        </AlertBanner>
        
        <div className="bg-state-error-lighter border-b border-red-100 relative">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span className="text-[18px] font-medium text-red-900">Red Flags</span>
          </div>
        </div>
        
        <div className="bg-white p-4">
          <ListItemContent
            title={
              <span className="text-red-800 font-bold text-[14px] leading-[20px]">
                Severe/worsening headache, repeated vomiting, confusion, drowsiness, seizures, weakness, difficulty speaking, fluid from nose/ears
              </span>
            }
            description={
              <span className="text-red-950 text-[12px] leading-[16px]">
                Call 911 right away if you get a very bad headache that doesn&apos;t get better with your pain medicine, if you vomit more than twice, feel very confused, have trouble staying awake, have a seizure, feel weak in your arms/legs, have slurred speech, or see fluid coming from your nose or ears.
              </span>
            }
          />
        </div>
      </div>
    </div>
  ),
}

export const FollowUpAppointments: Story = {
  name: 'Follow-Up Appointments (Composed)',
  render: () => (
    <div className="w-[340px]">
      <Card>
        <CardHeader color="neutral" variant="colored">
          <CardTitle>Follow-Up Care</CardTitle>
        </CardHeader>
        <Accordion defaultExpanded>
          <AccordionTrigger variant="padded">
            <ListHeader 
              icon={<Calendar className="w-4 h-4" />}
              action={<Badge variant="soft" color="neutral" size="sm" dot>3 Items</Badge>}
            >
              <span className="text-[18px] font-medium">Follow Up</span>
            </ListHeader>
          </AccordionTrigger>
          <AccordionContent padding="none">
            <List variant="divided" className="p-4">
              <ListSection>
                <Badge variant="outline" color="neutral" size="sm" className="mb-2">
                  Dr. Lisa Martinez
                </Badge>
                <ListItem
                  leading={<ListItemIcon><User className="w-4 h-4" /></ListItemIcon>}
                  trailing={<Badge variant="soft" color="primary" size="sm">3-5 days</Badge>}
                >
                  <ListItemContent
                    title="Primary Care Provider"
                    description="See your primary doctor in 3-5 days for a check-up."
                  />
                </ListItem>
              </ListSection>

              <ListSection>
                <Badge variant="outline" color="neutral" size="sm" className="mb-2">
                  Regional Neurology Associates
                </Badge>
                <ListItem
                  leading={<ListItemIcon><User className="w-4 h-4" /></ListItemIcon>}
                  trailing={<Badge variant="soft" color="primary" size="sm">1-2 weeks</Badge>}
                >
                  <ListItemContent
                    title="Neurology Specialist"
                    description="Schedule an appointment with a neurologist in 1-2 weeks."
                  />
                </ListItem>
              </ListSection>

              <ListSection>
                <Badge variant="outline" color="neutral" size="sm" className="mb-2">
                  Emergency Department
                </Badge>
                <ListItem
                  leading={<ListItemIcon><User className="w-4 h-4" /></ListItemIcon>}
                  trailing={<Badge variant="soft" color="primary" size="sm">If Needed</Badge>}
                >
                  <ListItemContent
                    title="Emergency Department"
                    description="Return to the emergency room if you notice any red flag symptoms."
                  />
                </ListItem>
              </ListSection>
            </List>
          </AccordionContent>
        </Accordion>
      </Card>
    </div>
  ),
}

export const CustomComposition: Story = {
  name: 'Custom Composition',
  render: () => (
    <div className="w-[500px] space-y-4">
      <h3 className="text-lg font-semibold">Compose accordions with any content:</h3>
      
      <Card>
        <Accordion defaultExpanded>
          <AccordionTrigger variant="padded">
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-gradient-to-br from-willow-primary-400 to-willow-primary-600 rounded-full" />
              <div className="flex-1">
                <h4 className="font-medium">Custom Header</h4>
                <p className="text-sm text-neutral-600">With any layout you want</p>
              </div>
              <Badge variant="soft" color="success">Active</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              <InfoCard variant="info">
                <strong>Flexible:</strong> Use any components inside
              </InfoCard>
              <InfoCard variant="success">
                <strong>Composable:</strong> Mix and match as needed
              </InfoCard>
            </div>
          </AccordionContent>
        </Accordion>
      </Card>
    </div>
  ),
}