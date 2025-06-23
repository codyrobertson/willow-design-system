import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { List, ListItem, ListItemContent, ListItemIcon, ListDivider, ListHeader, ListSection } from './List'
import { Badge } from './Badge'
import { Card } from './Card'
import { Pill, User, Calendar, Activity, Star, ChevronRight, MoreVertical } from 'lucide-react'

const meta = {
  title: 'UI/List',
  component: List,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The List component system provides a flexible way to create various types of lists.

## Components
- **List**: Container for list items
- **ListItem**: Individual list row with leading/trailing content
- **ListItemContent**: Structured content with title, subtitle, description
- **ListItemIcon**: Icon container with variants
- **ListDivider**: Separator between items
- **ListSection**: Group related items
- **ListHeader**: Section headers

## Features
- Flexible layouts with leading and trailing content
- Multiple content types (title, subtitle, description, overline)
- Icon containers with color variants
- Dividers and sections for organization
- Click handlers and selection states
        `
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof List>

export default meta
type Story = StoryObj<typeof meta>

// Basic Examples
export const BasicList: Story = {
  render: () => (
    <div className="w-[400px]">
      <Card>
        <List padding="md">
          <ListItem>Simple list item</ListItem>
          <ListItem>Another item</ListItem>
          <ListItem>Third item</ListItem>
        </List>
      </Card>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="w-[400px]">
      <Card>
        <List padding="md">
          <ListItem
            leading={<ListItemIcon><Pill /></ListItemIcon>}
          >
            Medications
          </ListItem>
          <ListItem
            leading={<ListItemIcon variant="primary"><User /></ListItemIcon>}
          >
            Profile Settings
          </ListItem>
          <ListItem
            leading={<ListItemIcon variant="success"><Activity /></ListItemIcon>}
          >
            Activity Log
          </ListItem>
        </List>
      </Card>
    </div>
  ),
}

export const WithContent: Story = {
  render: () => (
    <div className="w-[400px]">
      <Card>
        <List variant="divided" padding="md">
          <ListItem>
            <ListItemContent
              title="Primary Care Visit"
              subtitle="Dr. Sarah Johnson"
              description="Annual checkup scheduled"
            />
          </ListItem>
          <ListItem>
            <ListItemContent
              title="Lab Results"
              subtitle="Blood work complete"
              description="Results available in patient portal"
            />
          </ListItem>
          <ListItem>
            <ListItemContent
              title="Prescription Refill"
              subtitle="Lisinopril 10mg"
              description="Ready for pickup at pharmacy"
            />
          </ListItem>
        </List>
      </Card>
    </div>
  ),
}

export const ComplexListItems: Story = {
  name: 'Complex List Items',
  render: () => (
    <div className="w-[400px]">
      <Card>
        <List variant="divided">
          <ListItem
            leading={
              <ListItemIcon size="md" variant="primary">
                <User />
              </ListItemIcon>
            }
            trailing={<ChevronRight className="w-5 h-5 text-neutral-400" />}
            variant="clickable"
          >
            <ListItemContent
              overline="APPOINTMENT"
              title="Dr. Michael Chen"
              subtitle="Neurologist"
              description="Tomorrow at 2:30 PM"
            />
          </ListItem>
          
          <ListItem
            leading={
              <ListItemIcon size="md" variant="warning">
                <Pill />
              </ListItemIcon>
            }
            trailing={
              <Badge variant="soft" color="warning" size="sm">
                Refill needed
              </Badge>
            }
          >
            <ListItemContent
              overline="MEDICATION"
              title="Metformin 500mg"
              subtitle="Take twice daily with meals"
              description="30 day supply remaining"
            />
          </ListItem>
          
          <ListItem
            leading={
              <ListItemIcon size="md" variant="success">
                <Activity />
              </ListItemIcon>
            }
            trailing={
              <Badge variant="soft" color="success" size="sm">
                Completed
              </Badge>
            }
          >
            <ListItemContent
              overline="LAB TEST"
              title="Comprehensive Metabolic Panel"
              subtitle="Ordered by Dr. Johnson"
              description="Results within 24-48 hours"
            />
          </ListItem>
        </List>
      </Card>
    </div>
  ),
}

export const ListSections: Story = {
  render: () => (
    <div className="w-[400px]">
      <Card>
        <List padding="md">
          <ListSection
            title="Today"
            description="3 appointments"
          >
            <ListItem
              leading={<ListItemIcon><Calendar /></ListItemIcon>}
              trailing="9:00 AM"
            >
              Morning medication
            </ListItem>
            <ListItem
              leading={<ListItemIcon><Calendar /></ListItemIcon>}
              trailing="2:30 PM"
            >
              Doctor appointment
            </ListItem>
            <ListItem
              leading={<ListItemIcon><Calendar /></ListItemIcon>}
              trailing="6:00 PM"
            >
              Evening medication
            </ListItem>
          </ListSection>
          
          <ListDivider />
          
          <ListSection
            title="Tomorrow"
            description="2 appointments"
          >
            <ListItem
              leading={<ListItemIcon><Calendar /></ListItemIcon>}
              trailing="10:00 AM"
            >
              Lab work
            </ListItem>
            <ListItem
              leading={<ListItemIcon><Calendar /></ListItemIcon>}
              trailing="3:00 PM"
            >
              Physical therapy
            </ListItem>
          </ListSection>
        </List>
      </Card>
    </div>
  ),
}

export const SelectableList: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<number[]>([])
    
    const items = [
      { id: 1, name: 'Morning routine', time: '8:00 AM' },
      { id: 2, name: 'Take medication', time: '9:00 AM' },
      { id: 3, name: 'Doctor appointment', time: '2:30 PM' },
      { id: 4, name: 'Exercise', time: '5:00 PM' },
    ]
    
    return (
      <div className="w-[400px]">
        <Card>
          <List variant="divided" padding="md">
            <ListHeader
            icon={<Activity className="w-4 h-4" />}
            action={
              <Badge variant="soft" color="primary" size="sm">
                {selected.length} selected
              </Badge>
            }
          >
            Daily Tasks
            </ListHeader>
            {items.map((item) => (
              <ListItem
                key={item.id}
                variant="clickable"
                selected={selected.includes(item.id)}
                onClick={() => {
                  setSelected(prev =>
                    prev.includes(item.id)
                      ? prev.filter(id => id !== item.id)
                      : [...prev, item.id]
                  )
                }}
                leading={
                  <div className="w-5 h-5 border-2 border-neutral-300 rounded flex items-center justify-center">
                    {selected.includes(item.id) && (
                      <div className="w-3 h-3 bg-willow-primary-500 rounded" />
                    )}
                  </div>
                }
                trailing={
                  <span className="text-sm text-neutral-500">{item.time}</span>
                }
              >
                {item.name}
              </ListItem>
            ))}
          </List>
        </Card>
      </div>
    )
  },
}

export const VariantShowcase: Story = {
  name: 'Variants & States',
  render: () => (
    <div className="space-y-6">
      <div className="w-[400px]">
        <h3 className="text-sm font-medium mb-2">Default List</h3>
        <Card>
          <List padding="md">
            <ListItem>Item 1</ListItem>
            <ListItem>Item 2</ListItem>
            <ListItem>Item 3</ListItem>
          </List>
        </Card>
      </div>
      
      <div className="w-[400px]">
        <h3 className="text-sm font-medium mb-2">Divided List</h3>
        <Card>
          <List variant="divided" padding="md">
            <ListItem>Item with divider</ListItem>
            <ListItem>Another item</ListItem>
            <ListItem>Last item</ListItem>
          </List>
        </Card>
      </div>
      
      <div className="w-[400px]">
        <h3 className="text-sm font-medium mb-2">Spaced List</h3>
        <Card>
          <List variant="spaced" className="p-4">
            <ListItem className="bg-neutral-50 p-3 rounded">Spaced item 1</ListItem>
            <ListItem className="bg-neutral-50 p-3 rounded">Spaced item 2</ListItem>
            <ListItem className="bg-neutral-50 p-3 rounded">Spaced item 3</ListItem>
          </List>
        </Card>
      </div>
      
      <div className="w-[400px]">
        <h3 className="text-sm font-medium mb-2">Icon Variants</h3>
        <Card>
          <List variant="spaced" className="p-4">
            <ListItem leading={<ListItemIcon variant="default"><Star /></ListItemIcon>}>
              Default icon
            </ListItem>
            <ListItem leading={<ListItemIcon variant="primary"><Star /></ListItemIcon>}>
              Primary icon
            </ListItem>
            <ListItem leading={<ListItemIcon variant="success"><Star /></ListItemIcon>}>
              Success icon
            </ListItem>
            <ListItem leading={<ListItemIcon variant="warning"><Star /></ListItemIcon>}>
              Warning icon
            </ListItem>
            <ListItem leading={<ListItemIcon variant="danger"><Star /></ListItemIcon>}>
              Danger icon
            </ListItem>
            <ListItem leading={<ListItemIcon variant="info"><Star /></ListItemIcon>}>
              Info icon
            </ListItem>
          </List>
        </Card>
      </div>
    </div>
  ),
}

export const KeyboardNavigation: Story = {
  render: () => {
    const [selectedIndex, setSelectedIndex] = React.useState<number>(-1)
    const items = [
      { id: 1, name: 'Use arrow keys to navigate', icon: '⬆️⬇️' },
      { id: 2, name: 'Press Home to go to first item', icon: '🏠' },
      { id: 3, name: 'Press End to go to last item', icon: '🔚' },
      { id: 4, name: 'Click or press Enter/Space to select', icon: '✅' },
      { id: 5, name: 'Tab to focus the list', icon: '⌨️' },
    ]
    
    return (
      <div className="w-[400px]">
        <Card>
          <List enableKeyboardNavigation variant="divided" padding="md">
            <ListHeader>
              Keyboard Navigation Demo
            </ListHeader>
            {items.map((item, index) => (
              <ListItem
                key={item.id}
                variant="clickable"
                selected={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                leading={<span className="text-xl">{item.icon}</span>}
                trailing={
                  selectedIndex === index && (
                    <Badge variant="soft" color="primary" size="sm">
                      Selected
                    </Badge>
                  )
                }
              >
                {item.name}
              </ListItem>
            ))}
          </List>
        </Card>
      </div>
    )
  },
}