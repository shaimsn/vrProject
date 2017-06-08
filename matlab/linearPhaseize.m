function [output_in_3d] = linearPhaseize(input_in_3d, delayInSamples)
%LINPHASEIZE Convert Signal Bank to Linear Phase Filter
%   input_in_3d -- Signal Bank (One Signal for Each Row and Column)
%   delayInSamples -- Desired Delay of Linear Phase Filter in Samples (40)
%   output_in_3d -- Signal Bank Converted to Linear Phase Filters

[rows, cols, ~] = size(input_in_3d);

for i = 1:rows
    for j = 1:cols
        curr_hrir = squeeze(input_in_3d(i,j,:));
        curr_linphase_hrir = convert2linPhaseImp(curr_hrir, delayInSamples);
        output_in_3d(i,j,:) = curr_linphase_hrir;
    end
end

end