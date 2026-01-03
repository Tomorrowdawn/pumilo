import type { FC, ReactElement } from "react";
import { usePumiloContext } from "../context";

export interface PumiEditProps {
  id: string;
  label?: string;
  children: ReactElement;
}

export const PumiEdit: FC<PumiEditProps> = ({ id, label, children }) => {
  const { mode, data } = usePumiloContext();
  
  if (mode === "edit") {
    const childType = children.type as string;
    const defaultValue = typeof children.props.children === 'string' 
      ? children.props.children 
      : '';
    
    return (
      <>
        {children}
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            if (!window.__pumiloMetadataFields) {
              window.__pumiloMetadataFields = [];
            }
            window.__pumiloMetadataFields.push({
              id: "${id}",
              label: "${label || id}",
              type: "${childType}",
              defaultValue: "${defaultValue.replace(/"/g, '\\"')}"
            });
          })();
        `}} />
      </>
    );
  }
  
  const value = data[id] || (typeof children.props.children === 'string' ? children.props.children : '');
  
  return <children.type {...children.props}>{value}</children.type>;
};

