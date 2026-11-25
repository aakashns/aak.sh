import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion.tsx'

// Items with one name: opening one closes the others.
export default () => (
  <Accordion style="max-width: 28rem">
    <AccordionItem name="faq" open>
      <AccordionTrigger>Is it accessible?</AccordionTrigger>
      <AccordionContent>
        Yes. It's a native details element, so it works with any keyboard or screen reader.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem name="faq">
      <AccordionTrigger>Does it need JavaScript?</AccordionTrigger>
      <AccordionContent>
        No. The browser opens and closes it, and animates it where it can.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem name="faq">
      <AccordionTrigger>Can I search inside it?</AccordionTrigger>
      <AccordionContent>Yes. Find in page opens the item it finds your text in.</AccordionContent>
    </AccordionItem>
  </Accordion>
)
