import type { FC } from 'react';

interface SpacingBoxProps {
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  onChange: (property: string, value: string) => void;
}

export const SpacingBox: FC<SpacingBoxProps> = ({
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  onChange,
}) => {
  const parseVal = (val: string) => (val || '0').replace('px', '');

  const handleInputChange = (property: string, rawVal: string) => {
    const num = parseInt(rawVal, 10);
    const formatted = isNaN(num) ? '0px' : `${num}px`;
    onChange(property, formatted);
  };

  return (
    <div className="spacing-box-wrapper">
      <div className="box-model-container">
        {/* Margin Box */}
        <div className="box-margin">
          <span className="box-label margin-label">MARGIN</span>
          <input
            className="box-input margin-top"
            value={parseVal(marginTop)}
            onChange={(e) => handleInputChange('margin-top', e.target.value)}
            title="Margin Top"
          />
          <input
            className="box-input margin-left"
            value={parseVal(marginLeft)}
            onChange={(e) => handleInputChange('margin-left', e.target.value)}
            title="Margin Left"
          />
          <input
            className="box-input margin-right"
            value={parseVal(marginRight)}
            onChange={(e) => handleInputChange('margin-right', e.target.value)}
            title="Margin Right"
          />
          <input
            className="box-input margin-bottom"
            value={parseVal(marginBottom)}
            onChange={(e) => handleInputChange('margin-bottom', e.target.value)}
            title="Margin Bottom"
          />

          {/* Padding Box */}
          <div className="box-padding">
            <span className="box-label padding-label">PADDING</span>
            <input
              className="box-input padding-top"
              value={parseVal(paddingTop)}
              onChange={(e) => handleInputChange('padding-top', e.target.value)}
              title="Padding Top"
            />
            <input
              className="box-input padding-left"
              value={parseVal(paddingLeft)}
              onChange={(e) => handleInputChange('padding-left', e.target.value)}
              title="Padding Left"
            />
            <input
              className="box-input padding-right"
              value={parseVal(paddingRight)}
              onChange={(e) => handleInputChange('padding-right', e.target.value)}
              title="Padding Right"
            />
            <input
              className="box-input padding-bottom"
              value={parseVal(paddingBottom)}
              onChange={(e) => handleInputChange('padding-bottom', e.target.value)}
              title="Padding Bottom"
            />

            {/* Element Center */}
            <div className="box-element-center">
              <span>ELEMENT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
