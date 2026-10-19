import { EXPLAINER_SECTIONS } from './explainerSections';

export function DietExplainer() {
    return (
        <section className="mt-5 pt-4 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800">How did we get these numbers?</h3>
            {EXPLAINER_SECTIONS.map(section => (
                <div key={section.title} className="mt-3">
                    <h4 className="text-xs font-semibold text-neutral-800 mb-1">{section.title}</h4>
                    <div className="space-y-1.5">
                        {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                    </div>
                </div>
            ))}
        </section>
    );
}
