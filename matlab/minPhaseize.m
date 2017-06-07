function [min_hrir_3d, t_2d] = minPhaseize(hrir_3d)
%MINPHASEIZE Convert Signal Bank to Minimum Phase and Find Delays
%   hrir_3d -- Signal Bank (One Signal for Each Row and Column)
%   min_hrir_3d -- Signal Bank Converted to Minimum Phase
%   t_2d -- Delay Between Original and Minimum-Phase Signals

[rows, cols, depth] = size(hrir_3d);
min_hrir_3d = zeros(rows, cols, depth);
t_2d = zeros(rows, cols);

for i = 1:rows
    for j = 1:cols
        filter = squeeze(hrir_3d(i,j,:));
        [minPhaseFilter, ~, ~, delay] = convert2minPhaseImp( filter );
        min_hrir_3d(i,j,:) = minPhaseFilter; t_2d(i,j) = delay;
    end
end

end

