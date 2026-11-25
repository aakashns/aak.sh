import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion.tsx'

// Without a name, any number can be open.
export default () => (
  <Accordion style="max-width: 28rem">
    <AccordionItem>
      <AccordionTrigger>Shipping</AccordionTrigger>
      <AccordionContent>Orders ship within two business days.</AccordionContent>
    </AccordionItem>
    <AccordionItem>
      <AccordionTrigger>Returns</AccordionTrigger>
      <AccordionContent>Send it back within 30 days for a full refund.</AccordionContent>
    </AccordionItem>
  </Accordion>
)
