import type { Meta, StoryObj } from '@storybook/nextjs';
import { FormField } from './FormField';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Label } from './Label';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { User, Mail, Lock, Phone, MapPin, Calendar } from 'lucide-react';

const meta: Meta<typeof FormField> = {
  title: 'UI/Forms/Form Components',
  component: FormField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const AllFormFields: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <h2 className="text-2xl font-normal">Form Components</h2>
      
      <FormField label="Text Input" required>
        <Input placeholder="Enter your name" />
      </FormField>
      
      <FormField label="Email" hint="We'll never share your email">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" type="email" placeholder="you@example.com" />
        </div>
      </FormField>
      
      <FormField label="Password" error="Password must be at least 8 characters">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 border-destructive" type="password" placeholder="••••••••" />
        </div>
      </FormField>
      
      <FormField label="Description">
        <Textarea placeholder="Tell us about yourself..." rows={4} />
      </FormField>
      
      <FormField label="Country">
        <Select defaultValue="">
          <option value="" disabled>Select a country</option>
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
          <option value="ca">Canada</option>
          <option value="au">Australia</option>
        </Select>
      </FormField>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label htmlFor="terms" className="text-sm font-normal">
            I agree to the terms and conditions
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="newsletter" defaultChecked />
          <Label htmlFor="newsletter" className="text-sm font-normal">
            Subscribe to our newsletter
          </Label>
        </div>
      </div>
      
      <Button className="w-full">Submit</Button>
    </div>
  ),
};

export const TextareaExamples: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <FormField label="Default Textarea">
        <Textarea placeholder="Enter your message..." />
      </FormField>
      
      <FormField label="With Character Count" hint="Maximum 200 characters">
        <Textarea 
          placeholder="Write a brief description..." 
          maxLength={200}
          rows={3}
        />
      </FormField>
      
      <FormField label="Disabled Textarea">
        <Textarea 
          placeholder="This textarea is disabled" 
          disabled
          defaultValue="You cannot edit this text"
        />
      </FormField>
      
      <FormField label="Auto-resize Textarea">
        <Textarea 
          placeholder="This textarea can grow..." 
          className="min-h-[80px] resize-y"
        />
      </FormField>
    </div>
  ),
};

export const SelectExamples: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <FormField label="Basic Select">
        <Select>
          <option value="">Choose an option</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      </FormField>
      
      <FormField label="Select with Groups">
        <Select defaultValue="">
          <option value="" disabled>Select a fruit</option>
          <optgroup label="Citrus">
            <option value="orange">Orange</option>
            <option value="lemon">Lemon</option>
            <option value="lime">Lime</option>
          </optgroup>
          <optgroup label="Berries">
            <option value="strawberry">Strawberry</option>
            <option value="blueberry">Blueberry</option>
            <option value="raspberry">Raspberry</option>
          </optgroup>
        </Select>
      </FormField>
      
      <FormField label="Disabled Select">
        <Select disabled>
          <option>Disabled option</option>
        </Select>
      </FormField>
      
      <FormField label="Required Select" required error="Please select an option">
        <Select className="border-destructive" required>
          <option value="">Select an option</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      </FormField>
    </div>
  ),
};

export const CheckboxExamples: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <FormField label="Single Checkbox">
        <div className="flex items-center space-x-2">
          <Checkbox id="single" />
          <Label htmlFor="single" className="text-sm font-normal">
            Enable notifications
          </Label>
        </div>
      </FormField>
      
      <FormField label="Multiple Checkboxes">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="email" defaultChecked />
            <Label htmlFor="email" className="text-sm font-normal">
              Email notifications
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="sms" />
            <Label htmlFor="sms" className="text-sm font-normal">
              SMS notifications
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="push" defaultChecked />
            <Label htmlFor="push" className="text-sm font-normal">
              Push notifications
            </Label>
          </div>
        </div>
      </FormField>
      
      <FormField label="Disabled Checkboxes">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="disabled1" disabled />
            <Label htmlFor="disabled1" className="text-sm font-normal">
              Disabled unchecked
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="disabled2" disabled defaultChecked />
            <Label htmlFor="disabled2" className="text-sm font-normal">
              Disabled checked
            </Label>
          </div>
        </div>
      </FormField>
    </div>
  ),
};

export const CompleteForm: Story = {
  render: () => (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="John" />
              </div>
            </FormField>
            
            <FormField label="Last Name" required>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Doe" />
              </div>
            </FormField>
          </div>
          
          <FormField label="Email Address" required>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" type="email" placeholder="john.doe@example.com" />
            </div>
          </FormField>
          
          <FormField label="Phone Number">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" type="tel" placeholder="+1 (555) 123-4567" />
            </div>
          </FormField>
          
          <FormField label="Date of Birth" required>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" type="date" />
            </div>
          </FormField>
          
          <FormField label="Address">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea className="pl-10" placeholder="123 Main St, City, State 12345" rows={3} />
            </div>
          </FormField>
          
          <FormField label="Account Type" required>
            <Select defaultValue="">
              <option value="" disabled>Select account type</option>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </FormField>
          
          <FormField label="Password" required hint="At least 8 characters">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" type="password" placeholder="••••••••" />
            </div>
          </FormField>
          
          <FormField label="Confirm Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" type="password" placeholder="••••••••" />
            </div>
          </FormField>
          
          <div className="space-y-2 pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-sm font-normal">
                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="marketing" />
              <Label htmlFor="marketing" className="text-sm font-normal">
                Send me marketing emails about products and updates
              </Label>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1">Cancel</Button>
            <Button className="flex-1">Create Account</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  ),
};